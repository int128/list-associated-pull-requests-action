import { GitHub } from '@actions/github/lib/utils'
import {
  CommitQuery,
  CommitQueryVariables,
} from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query commit($owner: String!, $name: String!, $expression: String!) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        __typename
        ... on Commit {
          committedDate
        }
      }
    }
  }
`

export const getCommit = async (o: Octokit, v: CommitQueryVariables): Promise<CommitQuery> => await o.graphql(query, v)
