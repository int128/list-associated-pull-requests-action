import assert from 'node:assert'
import type { Octokit } from '@octokit/action'
import type { PathCommitIdSetMap } from './compare.js'
import type { Context } from './github.js'
import { type CommitPullQuery, executeCommitPullQuery } from './queries/commitPullQuery.js'

export const fetchCommitPullMap = async (
  commitIdSet: ReadonlySet<CommitId>,
  octokit: Octokit,
  context: Context,
): Promise<CommitPullMap> => {
  const chunks = splitArrayToChunks([...commitIdSet], 300)
  const mergedCommitPullMap = new Map<CommitId, Pull | null>()
  for (const chunk of chunks) {
    const commitPullQuery = await executeCommitPullQuery(octokit, context.repo.owner, context.repo.repo, new Set(chunk))
    const commitPullMap = buildCommitPullMap(commitPullQuery)
    for (const [commitId, pull] of commitPullMap) {
      mergedCommitPullMap.set(commitId, pull)
    }
  }
  return mergedCommitPullMap
}

export const splitArrayToChunks = <T>(a: readonly T[], batchSize: number): T[][] => {
  const chunks: T[][] = []
  for (let offset = 0; offset < a.length; offset += batchSize) {
    chunks.push(a.slice(offset, offset + batchSize))
  }
  return chunks
}

type CommitId = string

export type Pull = {
  number: number
  title: string
  author: string
}

export type CommitPullMap = ReadonlyMap<CommitId, Pull | null>

const buildCommitPullMap = (commitPullQuery: CommitPullQuery): CommitPullMap =>
  new Map(
    Object.values(commitPullQuery.repository).map((v) => {
      const associatedPullRequest = v.associatedPullRequests?.nodes?.at(0)
      const pull: Pull | null = associatedPullRequest
        ? {
            number: associatedPullRequest.number,
            title: associatedPullRequest.title,
            author: associatedPullRequest.author?.login ?? '',
          }
        : null
      return [v.oid, pull]
    }),
  )

type PullNumberOrCommitId = number | CommitId

type PullOrCommitId = Pull | CommitId

export type PullMap = ReadonlyMap<PullNumberOrCommitId, PullOrCommitId>

export type PathPullMap = ReadonlyMap<string, PullMap>

export const buildPathPullMap = (pathCommitIdSetMap: PathCommitIdSetMap, commitPullMap: CommitPullMap): PathPullMap =>
  new Map(
    pathCommitIdSetMap
      .entries()
      .map(([path, commitIdSet]) => [
        path,
        new Map(commitIdSet.values().map((commitId) => [commitId, commitPullMap.get(commitId) ?? commitId])),
      ]),
  )

export const buildOthers = (pathCommitIdSetMap: PathCommitIdSetMap, commitPullMap: CommitPullMap): PullMap => {
  const nonRoot = new Map(pathCommitIdSetMap)
  nonRoot.delete('.')
  const nonRootCommitIdSet = new Set(nonRoot.values().flatMap((x) => x.values()))

  const root = pathCommitIdSetMap.get('.')
  assert.ok(root, 'pathCommitIdSetMap must have root')
  const rootCommitIdSet = new Set(root.values())

  const othersCommitIdSet = rootCommitIdSet.difference(nonRootCommitIdSet)
  return new Map(othersCommitIdSet.values().map((commitId) => [commitId, commitPullMap.get(commitId) ?? commitId]))
}
