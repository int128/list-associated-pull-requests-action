import { GitHub } from '@actions/github/lib/utils'
import { CommitHistoryOfSubTreeQuery, CommitHistoryOfSubTreeQueryVariables } from '../generated/graphql'
import { retryHttpError } from './retry'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query commitHistoryOfSubTree(
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
            }
          }
        }
      }
    }
  }
`

export const findCommitHistoryOfSubTreeQuery = async (
  o: Octokit,
  variables: CommitHistoryOfSubTreeQueryVariables
): Promise<CommitHistoryOfSubTreeQuery> =>
  await retryHttpError((v) => o.graphql(query, v), {
    variables,
    nextVariables: (current: CommitHistoryOfSubTreeQueryVariables) => ({
      ...current,
      // decrease the page size to mitigate timeout error
      historySize: Math.floor(current.historySize * 0.8),
    }),
    count: 5,
    afterMs: 1000,
  })
