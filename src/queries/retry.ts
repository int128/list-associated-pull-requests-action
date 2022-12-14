import * as core from '@actions/core'
import { GraphqlResponseError } from '@octokit/graphql'

// Retry the query when it received a GraphQL error.
// Sometimes GitHub API returns the following error:
//  {
//    "data":null,
//    "errors":[{
//      "message":"Something went wrong while executing your query. This may be the result of a timeout, or it could be a GitHub bug. Please include `0000:0000:000000:000000:00000000` when reporting this issue."
//    }]
//  }
export const retryGraphqlResponseError = async <T>(
  query: () => Promise<T>,
  retryCount: number,
  retryAfterMs: number
): Promise<T> => {
  try {
    return await query()
  } catch (error) {
    core.warning(`[Before retry check] ${error}`) // TODO: Remove after finishing debug
    if (retryCount > 0 && error instanceof GraphqlResponseError) {
      core.warning(`retry after ${retryAfterMs}ms: ${String(error)}`)
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
      return await retryGraphqlResponseError(query, retryCount - 1, retryAfterMs * 2)
    }
    throw error
  }
}
