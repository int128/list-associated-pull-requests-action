import * as core from '@actions/core'
import { RequestError } from '@octokit/request-error'

export type RetrySpec<V> = {
  variables: V
  nextVariables: (current: V) => V
  remainingCount: number
  afterMs: number
}

// Retry the query when it received a GraphQL error.
// Sometimes GitHub API returns the following errors:
//  403:
//  You have exceeded a secondary rate limit. Please wait a few minutes before you try again.
//  502:
//  {
//    "data":null,
//    "errors":[{
//      "message":"Something went wrong while executing your query. This may be the result of a timeout, or it could be a GitHub bug. Please include `0000:0000:000000:000000:00000000` when reporting this issue."
//    }]
//  }
export const retryHttpError = async <T, V>(query: (v: V) => Promise<T>, spec: RetrySpec<V>): Promise<T> => {
  try {
    return await query(spec.variables)
  } catch (error) {
    if (!(error instanceof RequestError)) {
      throw error
    }
    if (spec.remainingCount === 0) {
      throw new Error(`retry over: ${String(error)}`)
    }

    if (error.status === 403) {
      // wait a longer time for secondary rate limit
      const waitMs = spec.afterMs + newJitter(60000)
      core.warning(`Retry after ${waitMs} ms: status ${error.status}: ${error.message}\n${error.stack}`)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return await retryHttpError(query, {
        variables: spec.variables,
        nextVariables: spec.nextVariables,
        remainingCount: spec.remainingCount - 1,
        afterMs: spec.afterMs * 2,
      })
    }

    const waitMs = spec.afterMs + newJitter(10000)
    core.warning(`Retry after ${waitMs} ms: status ${error.status}: ${error.message}\n${error.stack}`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    return await retryHttpError(query, {
      variables: spec.nextVariables(spec.variables),
      nextVariables: spec.nextVariables,
      remainingCount: spec.remainingCount - 1,
      afterMs: spec.afterMs * 2,
    })
  }
}

const newJitter = (maxMs: number) => Math.ceil(maxMs * Math.random())
