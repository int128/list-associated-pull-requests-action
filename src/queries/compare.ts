import { GitHub } from '@actions/github/lib/utils'
import { CompareBaseHeadQuery, CompareBaseHeadQueryVariables } from '../generated/graphql'
import { retryHttpError } from './retry'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query compareBaseHead($owner: String!, $name: String!, $base: String!, $head: String!, $size: Int!, $after: String) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $base) {
        compare(headRef: $head) {
          commits(first: $size, after: $after) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              committedDate
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

export const compareBaseHeadQuery = async (
  o: Octokit,
  variables: CompareBaseHeadQueryVariables
): Promise<CompareBaseHeadQuery> =>
  await retryHttpError((v) => o.graphql(query, v), {
    variables,
    nextVariables: (current: CompareBaseHeadQueryVariables) => ({
      ...current,
      // decrease the page size to mitigate timeout error
      size: Math.floor(current.size * 0.8),
    }),
    count: 5,
    afterMs: 1000,
  })
