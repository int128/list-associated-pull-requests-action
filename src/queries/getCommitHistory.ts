import assert from 'assert'
import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from '../generated/graphql'
import { RequestError } from '@octokit/request-error'
import { retryHttpError } from './retry'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query getCommitHistory(
    $owner: String!
    $name: String!
    $expression: String!
    $path: String!
    $since: GitTimestamp!
    $historySize: Int!
    $historyAfter: String
  ) {
    rateLimit {
      cost
      remaining
    }
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        __typename
        ... on Commit {
          history(path: $path, since: $since, first: $historySize, after: $historyAfter) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              oid
              associatedPullRequests(first: 1, orderBy: { field: CREATED_AT, direction: ASC }) {
                nodes {
                  number
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const execute = async (octokit: Octokit, v: GetCommitHistoryQueryVariables): Promise<GetCommitHistoryQuery> =>
  await paginate(withRetry(withOctokit(octokit)), v)

type QueryFunction = (v: GetCommitHistoryQueryVariables) => Promise<GetCommitHistoryQuery>

const withOctokit = (o: Octokit) => async (v: GetCommitHistoryQueryVariables) =>
  await o.graphql<GetCommitHistoryQuery>(query, v)

const withRetry = (fn: QueryFunction) => async (v: GetCommitHistoryQueryVariables) =>
  await retryHttpError(fn, {
    variables: v,
    nextVariables: (current: GetCommitHistoryQueryVariables) => ({
      ...current,
      // decrease the page size to mitigate timeout error
      historySize: Math.floor(current.historySize * 0.8),
    }),
    remainingCount: 10,
    afterMs: 3000,
    logger: (error: RequestError, waitMs: number, v: GetCommitHistoryQueryVariables) => {
      core.warning(`Retry after ${waitMs} ms: HTTP ${error.status}: ${error.message}`)
      core.startGroup(`GetCommitHistoryQuery: HTTP ${error.status}`)
      core.info(`variables: ${JSON.stringify(v, undefined, 2)}\nerror: ${error.stack}`)
      core.endGroup()
    },
  })

export const paginate = async (
  fn: QueryFunction,
  v: GetCommitHistoryQueryVariables,
  previous?: GetCommitHistoryQuery,
): Promise<GetCommitHistoryQuery> => {
  const query = await fn(v)
  assert(query.repository != null)
  assert(query.repository.object != null)
  assert.strictEqual(query.repository.object.__typename, 'Commit')
  assert(query.repository.object.history.nodes != null)

  if (previous !== undefined) {
    assert(previous.repository != null)
    assert(previous.repository.object != null)
    assert.strictEqual(previous.repository.object.__typename, 'Commit')
    assert(previous.repository.object.history.nodes != null)
    query.repository.object.history.nodes.unshift(...previous.repository.object.history.nodes)
  }

  core.info(
    `Received ${query.repository.object.history.nodes.length} / ${query.repository.object.history.totalCount} commits ` +
      `(path: ${v.path}) ` +
      `(ratelimit-remaining: ${query.rateLimit?.remaining})`,
  )

  if (!query.repository.object.history.pageInfo.hasNextPage) {
    return query
  }
  const historyAfter = query.repository.object.history.pageInfo.endCursor
  return await paginate(fn, { ...v, historyAfter }, query)
}
