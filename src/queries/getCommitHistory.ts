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

type QueryFunction = (v: GetCommitHistoryQueryVariables) => Promise<GetCommitHistoryQuery>

export const withOctokit =
  (o: Octokit): QueryFunction =>
  async (v: GetCommitHistoryQueryVariables): Promise<GetCommitHistoryQuery> =>
    await o.graphql(query, v)

export const withRetry =
  (getCommitHistory: QueryFunction): QueryFunction =>
  async (variables: GetCommitHistoryQueryVariables): Promise<GetCommitHistoryQuery> =>
    await retryHttpError(getCommitHistory, {
      variables,
      nextVariables: (current: GetCommitHistoryQueryVariables) => ({
        ...current,
        // decrease the page size to mitigate timeout error
        historySize: Math.floor(current.historySize * 0.8),
      }),
      remainingCount: 10,
      afterMs: 3000,
    })

export const paginate = async (
  getCommitHistory: QueryFunction,
  v: GetCommitHistoryQueryVariables,
): Promise<GetCommitHistoryQuery> => {
  const current = await getCommitHistory(v)
  core.startGroup(`GetCommitHistoryQuery(${JSON.stringify(v)})`)
  core.debug(JSON.stringify(current, undefined, 2))
  core.endGroup()

  assert(current.repository != null)
  assert(current.repository.object != null)
  assert.strictEqual(current.repository.object.__typename, 'Commit')
  assert(current.repository.object.history.nodes != null)
  if (!current.repository.object.history.pageInfo.hasNextPage) {
    return current
  }

  const historyAfter = current.repository.object.history.pageInfo.endCursor
  const next = await paginate(getCommitHistory, { ...v, historyAfter })
  assert(next.repository != null)
  assert(next.repository.object != null)
  assert.strictEqual(next.repository.object.__typename, 'Commit')
  assert(next.repository.object.history.nodes != null)
  next.repository.object.history.nodes = [
    ...current.repository.object.history.nodes,
    ...next.repository.object.history.nodes,
  ]
  return next
}
