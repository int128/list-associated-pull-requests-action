import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { compareCommits } from './compare'
import { Commit, getCommitHistory } from './history'

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
  const compare = await compareCommits(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`commits = ${compare.commitIds.size}`)
  core.info(`earliestCommit = ${compare.earliestCommitId} (${compare.earliestCommitDate.toISOString()})`)

  const commitsByPath = new Map<string, Commit[]>()
  for (const path of inputs.groupByPaths) {
    const commitHistory = await getCommitHistory(octokit, {
      owner: inputs.owner,
      repo: inputs.repo,
      ref: inputs.head,
      path,
      since: compare.earliestCommitDate,
      sinceCommitId: compare.earliestCommitId,
    })
    const commits = commitHistory.filter((commit) => compare.commitIds.has(commit.commitId))
    commitsByPath.set(path, commits)
  }
  if (!inputs.showOthersGroup) {
    return { commitsByPath }
  }

  const rootCommitHistory = await getCommitHistory(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    ref: inputs.head,
    path: '.',
    since: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
  })
  const rootCommits = rootCommitHistory.filter((commit) => compare.commitIds.has(commit.commitId))

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
