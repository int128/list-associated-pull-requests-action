import assert from 'assert'
import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { Commit, CommitHistoryByPath, getCommitHistoryByPath } from './history'
import { compareCommits } from './compare'

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

  const groupByPaths = [...inputs.groupByPaths]
  if (inputs.showOthersGroup) {
    groupByPaths.push('.')
  }
  const commitHistoryByPath = await getCommitHistoryByPath(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.head,
    groupByPaths,
    sinceCommitDate: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
    filterCommitIds: compare.commitIds,
  })

  if (!inputs.showOthersGroup) {
    return { commitsByPath: commitHistoryByPath }
  }
  return {
    commitsByPath: commitHistoryByPath,
    others: computeOthers(commitHistoryByPath),
  }
}

const computeOthers = (commitHistoryByPath: CommitHistoryByPath): Commit[] => {
  const rootCommits = commitHistoryByPath.get('.')
  assert(rootCommits !== undefined)

  commitHistoryByPath.delete('.')

  const otherCommits = new Map<string, Commit>()
  for (const commit of rootCommits) {
    otherCommits.set(commit.commitId, commit)
  }
  for (const [, commits] of commitHistoryByPath) {
    for (const commit of commits) {
      otherCommits.delete(commit.commitId)
    }
  }
  return [...otherCommits.values()]
}
