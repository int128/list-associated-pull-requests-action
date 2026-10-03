import assert from 'node:assert'
import { CommitPullMap } from './queries/getCommitPulls.js'

export type Commit = {
  commitId: string
  pull?: {
    number: number
    title: string
    author: string
  }
}

export type PathCommitMap = Map<string, Commit[]>

export const buildCommitHistoryGroups = (
  pathCommitIdsMap: Map<string, Set<string>>,
  commitPullMap: CommitPullMap,
): PathCommitMap => {
  const groups: PathCommitMap = new Map()
  for (const [path, commitIds] of pathCommitIdsMap) {
    groups.set(
      path,
      dedupeCommitsByPullRequest(
        [...commitIds].map((commitId) => {
          const pull = commitPullMap.get(commitId)
          return pull ? { commitId, pull } : { commitId }
        }),
      ),
    )
  }
  return groups
}

type ExtractedCommitHistoryGroups = {
  groups: PathCommitMap
  others: Commit[]
}

export const extractOthersFromCommitHistoryGroups = (
  commitHistoryGroups: PathCommitMap,
): ExtractedCommitHistoryGroups => {
  const groups = new Map(commitHistoryGroups)
  groups.delete('.')

  const commitIdsInGroups = new Set<string>()
  for (const commits of groups.values()) {
    for (const commit of commits) {
      commitIdsInGroups.add(commit.commitId)
    }
  }

  const root = commitHistoryGroups.get('.')
  assert(root !== undefined)
  const others = root.filter((commit) => !commitIdsInGroups.has(commit.commitId))
  return { groups, others }
}

export const dedupeCommitsByPullRequest = (commits: Commit[]): Commit[] => {
  const deduped = new Map<number | string, Commit>()
  for (const commit of commits) {
    const key = commit.pull?.number ?? commit.commitId
    if (!deduped.has(key)) {
      deduped.set(key, commit)
    }
  }
  return [...deduped.values()]
}
