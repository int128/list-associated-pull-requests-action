import assert from 'assert'
import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from '../generated/graphql'
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
  await paginate(withRetry(withLogger(withOctokit(octokit))), v)

type QueryFunction = (v: GetCommitHistoryQueryVariables) => Promise<GetCommitHistoryQuery>

const withOctokit = (o: Octokit) => async (v: GetCommitHistoryQueryVariables) =>
  await o.graphql<GetCommitHistoryQuery>(query, v)

const withLogger = (fn: QueryFunction) => async (v: GetCommitHistoryQueryVariables) => {
  const query = await fn(v)
  core.startGroup(`GetCommitHistoryQuery(${JSON.stringify(v)})`)
  core.debug(JSON.stringify(query, undefined, 2))
  core.endGroup()
  return query
}

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
  })

const paginate = async (
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
    query.repository.object.history.nodes = [
      ...previous.repository.object.history.nodes,
      ...query.repository.object.history.nodes,
    ]
  }

  const receivedCount = query.repository.object.history.nodes.length
  const { totalCount } = query.repository.object.history
  core.info(`Received ${receivedCount} / ${totalCount} commits (ratelimit-remaining: ${query.rateLimit?.remaining})`)

  if (!query.repository.object.history.pageInfo.hasNextPage) {
    return query
  }
  const historyAfter = query.repository.object.history.pageInfo.endCursor
  return await paginate(fn, { ...v, historyAfter }, query)
}
