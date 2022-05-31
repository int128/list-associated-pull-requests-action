import { GitHub } from '@actions/github/lib/utils'
import {
  CommitHistoryOfSubTreeQuery,
  CommitHistoryOfSubTreeQueryVariables,
} from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query commitHistoryOfSubTree(
    $owner: String!
    $name: String!
    $oid: GitObjectID!
    $path: String!
    $since: GitTimestamp!
  ) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      object(oid: $oid) {
        __typename
        ... on Commit {
          history(path: $path, since: $since) {
            nodes {
              oid
            }
          }
        }
      }
    }
  }
`

export const getCommitHistoryOfSubTree = async (
  o: Octokit,
  v: CommitHistoryOfSubTreeQueryVariables
): Promise<CommitHistoryOfSubTreeQuery> => await o.graphql(query, v)
