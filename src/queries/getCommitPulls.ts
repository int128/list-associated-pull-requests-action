import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { retryHttpError } from './retry.js'

export type CommitPull = {
  number: number
  title: string
  author: string
}

export type CommitPullMap = Map<string, CommitPull | undefined>

const COMMIT_BATCH_SIZE = 100

const commitPullFragment = /* GraphQL */ `
  fragment CommitPull on Commit {
    oid
    associatedPullRequests(first: 1, orderBy: { field: CREATED_AT, direction: ASC }) {
      nodes {
        number
        title
        author { login }
      }
    }
  }
`

export const getCommitPulls = async (
  octokit: Octokit,
  owner: string,
  name: string,
  commitIdSet: Set<string>,
): Promise<CommitPullMap> => {
  const uniqueCommitIds = [...commitIdSet]
  const batches: string[][] = []
  for (let offset = 0; offset < uniqueCommitIds.length; offset += COMMIT_BATCH_SIZE) {
    batches.push(uniqueCommitIds.slice(offset, offset + COMMIT_BATCH_SIZE))
  }

  const result: CommitPullMap = new Map()
  for (const [batchIndex, batch] of batches.entries()) {
    const query = makeCommitPullQuery(batch.length)
    const shaVariables = Object.fromEntries(batch.map((id, i) => [`sha${i}`, id]))
    const response = await retryHttpError((v) => octokit.graphql<Record<string, unknown>>(query, v), {
      variables: {
        owner,
        name,
        ...shaVariables,
      },
      retryVariables: (v) => v,
      remainingCount: 10,
    })
    const repository = response.repository as Record<string, unknown> | null
    for (let i = 0; i < batch.length; i++) {
      const object = repository?.[`c${i}`] as {
        oid?: string
        associatedPullRequests?: {
          nodes?: Array<{ number?: number; title?: string; author?: { login?: string } | null } | null> | null
        }
      } | null
      const pull = object?.associatedPullRequests?.nodes?.find((node) => node?.number !== undefined)
      result.set(
        batch[i],
        pull?.number === undefined
          ? undefined
          : {
              number: pull.number,
              title: pull.title ?? '',
              author: pull.author?.login ?? '',
            },
      )
    }
    core.info(`GetCommitPulls: received batch ${batchIndex + 1} / ${batches.length} (${batch.length} commits)`)
  }
  return result
}

const makeCommitPullQuery = (count: number) => {
  const declarations = Array.from({ length: count }, (_, i) => `$sha${i}: String!`)
  const fields = Array.from({ length: count }, (_, i) => `c${i}: object(expression: $sha${i}) { ...CommitPull }`)
  return `query($owner: String!, $name: String!, ${declarations.join(', ')}) { repository(owner: $owner, name: $name) { ${fields.join('\n')} } }\n${commitPullFragment}`
}
