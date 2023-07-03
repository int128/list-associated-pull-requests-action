import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { Commit, compareBaseHead } from './compare'
import { findCommitHistoryOfSubTree } from './history'
import { findEarliestCommit } from './commit'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  base: string
  head: string
  groupByPaths: string[]
  showOthersGroup: boolean
}

type Outputs = {
  commitsByPath: Map<string, Commit[]>
  others?: Commit[]
}

export const listAssociatedPullRequests = async (octokit: Octokit, inputs: Inputs): Promise<Outputs> => {
  core.info(`Compare ${inputs.base} and ${inputs.head}`)
  const diffCommits = await compareBaseHead(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`commits = ${diffCommits.length}`)

  const earliestCommit = findEarliestCommit(diffCommits)
  core.info(`earliestCommit = ${earliestCommit.commitId} (${earliestCommit.committedDate.toISOString()})`)

  const commitsByPath = new Map<string, Commit[]>()
  for (const path of inputs.groupByPaths) {
    core.info(`Finding commit history of path ${path}`)
    const subTreeCommitIds = await findCommitHistoryOfSubTree(octokit, {
      owner: inputs.owner,
      repo: inputs.repo,
      ref: inputs.head,
      path,
      since: earliestCommit.committedDate,
      sinceCommitId: earliestCommit.commitId,
    })
    const subTreeCommitIdSet = new Set(subTreeCommitIds)
    const commits = diffCommits.filter((commit) => subTreeCommitIdSet.has(commit.commitId))
    commitsByPath.set(path, commits)
  }
  if (!inputs.showOthersGroup) {
    return { commitsByPath }
  }

  core.info(`Finding commit history of root`)
  const rootCommitIds = await findCommitHistoryOfSubTree(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    ref: inputs.head,
    path: '.',
    since: earliestCommit.committedDate,
    sinceCommitId: earliestCommit.commitId,
  })
  const rootCommitIdSet = new Set(rootCommitIds)
  const rootCommits = diffCommits.filter((commit) => rootCommitIdSet.has(commit.commitId))

  const otherCommits = new Map<string, Commit>()
  for (const commit of rootCommits) {
    otherCommits.set(commit.commitId, commit)
  }
  for (const [, commits] of commitsByPath) {
    for (const commit of commits) {
      otherCommits.delete(commit.commitId)
    }
  }

  return {
    commitsByPath,
    others: [...otherCommits.values()],
  }
}
