import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { PathCommitIdSetMap } from './compare.js'
import type { Context } from './github.js'
import { type CommitPullQuery, executeCommitPullQuery } from './queries/commitPullQuery.js'

export const fetchCommitPullMap = async (
  commitIdSet: ReadonlySet<CommitId>,
  octokit: Octokit,
  context: Context,
): Promise<CommitPullMap> => {
  const FETCH_BATCH_SIZE = 100
  const mergedCommitPullMap = new Map<CommitId, Pull | null>()
  core.info(`Fetching the associated pull requests for ${commitIdSet.size} commits`)
  for (const chunk of splitSet(commitIdSet.values(), FETCH_BATCH_SIZE)) {
    const commitPullQuery = await executeCommitPullQuery(octokit, context.repo.owner, context.repo.repo, chunk)
    const commitPullMap = buildCommitPullMap(commitPullQuery)
    for (const [commitId, pull] of commitPullMap) {
      mergedCommitPullMap.set(commitId, pull)
    }
    core.info(`Fetched ${mergedCommitPullMap.size} commits`)
  }
  return mergedCommitPullMap
}

export const splitSet = <T>(it: SetIterator<T>, batchSize: number): ReadonlySet<T>[] => {
  for (const chunks = []; ; ) {
    const chunk = new Set(it.take(batchSize))
    if (chunk.size === 0) {
      return chunks
    }
    chunks.push(chunk)
  }
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

type PullOrCommitId = Pull | CommitId

export type PullSet = ReadonlySet<PullOrCommitId>

const buildPullSet = (commitIdSet: Set<CommitId>, commitPullMap: CommitPullMap): PullSet =>
  new Set(
    new Map(
      commitIdSet.values().map((commitId) => {
        const pull = commitPullMap.get(commitId)
        // Dudupe by pull number or commitId
        return [pull?.number ?? commitId, pull ?? commitId]
      }),
    ).values(),
  )

export type PathPullSet = ReadonlyMap<string, PullSet>

export const buildPathPullSet = (pathCommitIdSetMap: PathCommitIdSetMap, commitPullMap: CommitPullMap): PathPullSet =>
  new Map(pathCommitIdSetMap.entries().map(([path, commitIdSet]) => [path, buildPullSet(commitIdSet, commitPullMap)]))

export const buildOthers = (pathCommitIdSetMap: PathCommitIdSetMap, commitPullMap: CommitPullMap): PullSet => {
  const nonRoot = new Map(pathCommitIdSetMap.entries().filter(([path]) => path !== '.'))
  const nonRootCommitIdSet = new Set(nonRoot.values().flatMap((x) => x.values()))

  const root = pathCommitIdSetMap.get('.')
  assert.ok(root, 'pathCommitIdSetMap must have root')
  const rootCommitIdSet = new Set(root.values())

  const othersCommitIdSet = rootCommitIdSet.difference(nonRootCommitIdSet)
  return buildPullSet(othersCommitIdSet, commitPullMap)
}
