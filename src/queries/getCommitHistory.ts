import assert from 'assert'
import * as core from '@actions/core'
import { Octokit } from '@octokit/action'
import { retryHttpError } from './retry.js'
import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from '../generated/graphql.js'

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
                  title
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

type Options = {
  maxFetchCommits: number | undefined
}

export const execute = async (
  octokit: Octokit,
  v: GetCommitHistoryQueryVariables,
  o: Options,
): Promise<GetCommitHistoryQuery> => await paginate(withRetry(withOctokit(octokit)), v, o)

type QueryFunction = (v: GetCommitHistoryQueryVariables) => Promise<GetCommitHistoryQuery>

const withOctokit = (o: Octokit) => async (v: GetCommitHistoryQueryVariables) =>
  await o.graphql<GetCommitHistoryQuery>(query, v)

const withRetry = (fn: QueryFunction) => async (v: GetCommitHistoryQueryVariables) =>
  await retryHttpError(fn, {
    variables: v,
    retryVariables: (current: GetCommitHistoryQueryVariables) => ({
      ...current,
      // decrease the page size to mitigate the timeout error
      historySize: Math.floor(current.historySize * 0.8),
    }),
    remainingCount: 10,
  })

export const paginate = async (
  fn: QueryFunction,
  v: GetCommitHistoryQueryVariables,
  o: Options,
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

  const receivedCount = query.repository.object.history.nodes.length
  core.info(
    `Received ${receivedCount} / ${query.repository.object.history.totalCount} commits ` +
      `(path: ${v.path}) ` +
      `(ratelimit-remaining: ${query.rateLimit?.remaining})`,
  )

  if (!query.repository.object.history.pageInfo.hasNextPage) {
    return query
  }
  if (o.maxFetchCommits !== undefined && receivedCount > o.maxFetchCommits) {
    core.warning(`Gave up fetching commits due to maxFetchCommits=${o.maxFetchCommits}`)
    return query
  }
  const historyAfter = query.repository.object.history.pageInfo.endCursor
  return await paginate(fn, { ...v, historyAfter }, o, query)
}
