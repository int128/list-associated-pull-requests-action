import * as core from '@actions/core'
import { RequestError } from '@octokit/request-error'

const DO_NOT_RETRY_CODES = [400, 401, 404, 422, 451]

export type RetrySpec<V> = {
  variables: V
  retryVariables: (current: V) => V
  remainingCount: number
  afterMs: number
  maxJitterMs: number
}

// Retry the query when it received a GraphQL error.
// Sometimes GitHub API returns the following errors:
//  HTTP 403:
//  You have exceeded a secondary rate limit. Please wait a few minutes before you try again.
//  HTTP 502:
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
    if (DO_NOT_RETRY_CODES.includes(error.status)) {
      throw error
    }
    if (spec.remainingCount === 0) {
      throw new Error(`retry over: ${String(error)}`)
    }

    // For the secondary rate limits, respect retry-after header.
    // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#secondary-rate-limits
    if (error.status === 403) {
      const retryAfterMs = getRetryAfterHeaderMs(error, 30000)
      const afterMs = retryAfterMs + newJitter(spec.maxJitterMs)
      logger(error, afterMs, spec.variables)
      await sleep(afterMs)
      return await retryHttpError(query, {
        ...spec,
        remainingCount: spec.remainingCount - 1,
        // retry with the same variables
      })
    }

    // For a temporary error, try the new variables.
    const afterMs = spec.afterMs + newJitter(spec.maxJitterMs)
    logger(error, afterMs, spec.variables)
    await sleep(afterMs)
    return await retryHttpError(query, {
      ...spec,
      variables: spec.retryVariables(spec.variables),
      remainingCount: spec.remainingCount - 1,
      afterMs: spec.afterMs * 2,
    })
  }
}

const getRetryAfterHeaderMs = (error: RequestError, defaultValue: number): number => {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
  const sec = Number(error.response?.headers['retry-after'])
  if (Number.isSafeInteger(sec)) {
    return sec * 1000
  }
  return defaultValue
}

const newJitter = (maxMs: number) => Math.ceil(maxMs * Math.random())

const sleep = (waitMs: number) => new Promise((resolve) => setTimeout(resolve, waitMs))

const logger = <V>(error: RequestError, afterMs: number, v: V) => {
  core.warning(`Retry after ${Math.round(afterMs / 1000)}s: HTTP ${error.status}: ${error.message}`)
  core.startGroup(`HTTP ${error.status}`)
  core.info(JSON.stringify(v, undefined, 2))
  if (error.response) {
    core.info(`retry-after: ${error.response.headers['retry-after']}`)
    core.info(`x-github-request-id: ${error.response.headers['x-github-request-id']}`)
  }
  core.endGroup()
}
