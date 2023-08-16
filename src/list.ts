import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { CommitHistoryByPath, getCommitHistoryByPath } from './history'
import { compareCommits } from './compare'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  base: string
  head: string
  groupByPaths: string[]
}

export const getCommitHistoryByPathInBaseHead = async (
  octokit: Octokit,
  inputs: Inputs,
): Promise<CommitHistoryByPath> => {
  core.info(`Compare ${inputs.base} and ${inputs.head}`)
  const compare = await compareCommits(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`commits = ${compare.commitIds.size}`)
  core.info(`earliestCommit = ${compare.earliestCommitId} (${compare.earliestCommitDate.toISOString()})`)

  return await getCommitHistoryByPath(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.head,
    groupByPaths: inputs.groupByPaths,
    sinceCommitDate: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
    filterCommitIds: compare.commitIds,
  })
}
