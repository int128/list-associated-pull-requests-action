import { GitHub } from '@actions/github/lib/utils'
import {
  AssociatedPullRequestsInCommitHistoryOfSubTreeQuery,
  AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables,
} from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query associatedPullRequestsInCommitHistoryOfSubTree(
    $owner: String!
    $name: String!
    $expression: String!
    $path: String!
    $since: GitTimestamp!
  ) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        __typename
        ... on Commit {
          history(path: $path, since: $since) {
            nodes {
              oid
              associatedPullRequests(first: 1, orderBy: { field: CREATED_AT, direction: ASC }) {
                nodes {
                  number
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
  v: AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables
): Promise<AssociatedPullRequestsInCommitHistoryOfSubTreeQuery> => await o.graphql(query, v)
