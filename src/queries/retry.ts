import * as core from '@actions/core'
import { RequestError } from '@octokit/request-error'

export type RetrySpec<V> = {
  variables: V
  nextVariables: (current: V) => V
  count: number
  afterMs: number
}

// Retry the query when it received a GraphQL error.
// Sometimes GitHub API returns the following error:
//  {
//    "data":null,
//    "errors":[{
//      "message":"Something went wrong while executing your query. This may be the result of a timeout, or it could be a GitHub bug. Please include `0000:0000:000000:000000:00000000` when reporting this issue."
//    }]
//  }
export const retryHttpError = async <T, V>(query: (v: V) => Promise<T>, spec: RetrySpec<V>): Promise<T> => {
  try {
    core.info(`query with variables ${JSON.stringify(spec.variables)}`)
    return await query(spec.variables)
  } catch (error) {
    if (spec.count > 0 && error instanceof RequestError) {
      core.warning(`retry after ${spec.afterMs} ms: status ${error.status}: ${String(error)}`)
      await new Promise((resolve) => setTimeout(resolve, spec.afterMs))
      return await retryHttpError(query, {
        variables: spec.nextVariables(spec.variables),
        nextVariables: spec.nextVariables,
        count: spec.count - 1,
        afterMs: spec.afterMs * 2,
      })
    }
    throw error
  }
}
