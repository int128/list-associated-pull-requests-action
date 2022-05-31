import { GitHub } from '@actions/github/lib/utils'
import { PullRequestCommitsQuery, PullRequestCommitsQueryVariables } from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query pullRequestCommits($owner: String!, $name: String!, $number: Int!, $commitCursor: String) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRefOid
        commits(first: 100, after: $commitCursor) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            commit {
              oid
              committedDate
              associatedPullRequests(first: 1) {
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

export const getPullRequestCommits = async (
  o: Octokit,
  v: PullRequestCommitsQueryVariables,
  a: PullRequestCommitsQuery[] = []
): Promise<PullRequestCommitsQuery[]> => {
  const r = await o.graphql<PullRequestCommitsQuery>(query, v)
  const pageInfo = r.repository?.pullRequest?.commits.pageInfo
  if (pageInfo && pageInfo.hasNextPage && pageInfo.endCursor) {
    return await getPullRequestCommits(o, { ...v, commitCursor: pageInfo.endCursor }, [...a, r])
  }
  return [...a, r]
}
