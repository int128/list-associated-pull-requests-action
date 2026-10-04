import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { CommitPullFragment } from '../generated/graphql.js'
import { retryHttpError } from './retry.js'

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

const createQuery = (commitVars: string[]) => `
  query CommitPull($owner: String!, $name: String!, ${commitVars.map((v) => `$${v}: GitObjectID!`).join(', ')}) {
    repository(owner: $owner, name: $name) {
      ${commitVars.map((v) => `${v}: object(oid: $${v}) { ...CommitPull }`).join('\n')}
    }
  }
  ${commitPullFragment}
`

export type CommitPullQuery = {
  repository: {
    [vIndex: string]: CommitPullFragment
  }
}

export const executeCommitPullQuery = async (
  octokit: Octokit,
  owner: string,
  name: string,
  commitIdSet: ReadonlySet<string>,
): Promise<CommitPullQuery> => {
  const commitVarMap = new Map(commitIdSet.values().map((commitId, index) => [`v${index}`, commitId]))
  const query = createQuery(commitVarMap.keys().toArray())
  return await core.group(
    `query CommitPull(${owner}, ${name}, ${commitIdSet.size})`,
    async () =>
      await retryHttpError(
        async () =>
          await octokit.graphql<CommitPullQuery>(query, {
            owner,
            name,
            ...Object.fromEntries(commitVarMap),
          }),
        { remainingCount: 10 },
      ),
  )
}
