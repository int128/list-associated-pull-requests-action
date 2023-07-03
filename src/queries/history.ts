import { GitHub } from '@actions/github/lib/utils'
import {
  AssociatedPullRequestsInCommitHistoryOfSubTreeQuery,
  AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables,
} from '../generated/graphql'
import { retryHttpError } from './retry'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query associatedPullRequestsInCommitHistoryOfSubTree(
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

export const getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery = async (
  o: Octokit,
  variables: AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables
): Promise<AssociatedPullRequestsInCommitHistoryOfSubTreeQuery> =>
  await retryHttpError((v) => o.graphql(query, v), {
    variables,
    nextVariables: (current: AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables) => ({
      ...current,
      // decrease the page size to mitigate timeout error
      historySize: Math.floor(current.historySize * 0.8),
    }),
    remainingCount: 10,
    afterMs: 3000,
  })
