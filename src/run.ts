import * as core from '@actions/core'
import { Context } from './github.js'
import { Octokit } from '@octokit/action'
import { compareCommits } from './compare.js'
import { Commit, CommitHistoryByPath, getCommitHistoryByPath, getCommitHistoryGroupsAndOthers } from './history.js'

type Inputs = {
  pullRequest?: number
  base?: string
  head?: string
  groupByPaths: string[]
  showOthersGroup: boolean
  maxFetchCommits: number | undefined
}

type Outputs = {
  body: string
  bodyGroups: string
  bodyOthers: string
}

const parseInputs = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  if (inputs.pullRequest) {
    const { data: pull } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: inputs.pullRequest,
    })
    core.info(`Found #${pull.number}`)
    return { base: pull.base.sha, head: pull.head.sha }
  }
  const { base, head } = inputs
  if (!base || !head) {
    throw new Error('you need to set either pull-request or base/head')
  }
  return { base, head }
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs> => {
  const groupByPaths = sanitizePaths(inputs.groupByPaths)

  const { base, head } = await parseInputs(inputs, octokit, context)
  const compare = await compareCommits(octokit, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    base,
    head,
  })
  core.info(`The earliest commit is ${compare.earliestCommitId} at ${compare.earliestCommitDate.toISOString()}`)

  if (inputs.showOthersGroup) {
    const commitHistoryGroupsAndOthers = await getCommitHistoryGroupsAndOthers(octokit, {
      owner: context.repo.owner,
      name: context.repo.repo,
      expression: head,
      groupByPaths,
      sinceCommitDate: compare.earliestCommitDate,
      sinceCommitId: compare.earliestCommitId,
      filterCommitIds: compare.commitIds,
      maxFetchCommits: inputs.maxFetchCommits,
    })
    const bodyGroups = formatCommitHistory(commitHistoryGroupsAndOthers.groups)
    const bodyOthers = formatCommitHistory(new Map([['Others', commitHistoryGroupsAndOthers.others]]))
    return {
      body: [bodyGroups, bodyOthers].join('\n').trim(),
      bodyGroups,
      bodyOthers,
    }
  }

  const commitHistoryByPath = await getCommitHistoryByPath(octokit, {
    owner: context.repo.owner,
    name: context.repo.repo,
    expression: head,
    groupByPaths,
    sinceCommitDate: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
    filterCommitIds: compare.commitIds,
    maxFetchCommits: inputs.maxFetchCommits,
  })
  const body = formatCommitHistory(commitHistoryByPath)
  return { body, bodyGroups: body, bodyOthers: '' }
}

const sanitizePaths = (groupByPaths: string[]) => groupByPaths.filter((p) => p.length > 0 && !p.startsWith('#'))

const formatCommitHistory = (commitHistoryByPath: CommitHistoryByPath): string => {
  const body = []
  for (const [path, commits] of commitHistoryByPath) {
    body.push(`### ${path}`)
    body.push(...formatCommits(commits))
  }
  return body.join('\n')
}

const formatCommits = (commits: Commit[]): string[] => [
  ...new Set(
    commits.map((commit) => {
      if (commit.pull) {
        return `- #${commit.pull.number} @${commit.pull.author}`
      }
      return `- ${commit.commitId}`
    }),
  ),
]
