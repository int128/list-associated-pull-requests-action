import assert from 'assert'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Commit, CommitHistoryByPath, getCommitHistoryByPath } from './history'
import { GitHub } from '@actions/github/lib/utils'
import { compareCommits } from './compare'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  token: string
  pullRequest?: number
  base?: string
  head?: string
  groupByPaths: string[]
  showOthersGroup: boolean
}

type Outputs = {
  body: string
  bodyGroups: string
  bodyOthers: string
}

const parseInputs = async (octokit: Octokit, inputs: Inputs) => {
  if (inputs.pullRequest) {
    const { data: pull } = await octokit.rest.pulls.get({
      owner: inputs.owner,
      repo: inputs.repo,
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

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  const { base, head } = await parseInputs(octokit, inputs)
  core.info(`Comparing base ${base} and head ${head}`)
  const compare = await compareCommits(octokit, {
    owner: inputs.owner,
    repo: inputs.repo,
    base,
    head,
  })
  core.info(`Found ${compare.commitIds.size} commits`)
  core.info(`The earliest commit is ${compare.earliestCommitId} at ${compare.earliestCommitDate.toISOString()}`)

  const groupByPaths = sanitizePaths(inputs.groupByPaths)
  if (inputs.showOthersGroup) {
    groupByPaths.push('.')
  }
  core.info(`Getting commit history`)
  const commitHistoryByPath = await getCommitHistoryByPath(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: head,
    groupByPaths,
    sinceCommitDate: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
    filterCommitIds: compare.commitIds,
  })

  if (!inputs.showOthersGroup) {
    const body = formatCommitHistory(commitHistoryByPath)
    return { body, bodyGroups: body, bodyOthers: '' }
  }

  const { groups, others } = computeGroupsOthers(commitHistoryByPath)
  const bodyGroups = formatCommitHistory(groups)
  const bodyOthers = formatCommitHistory(others)
  return {
    body: [bodyGroups, bodyOthers].join('\n').trim(),
    bodyGroups,
    bodyOthers,
  }
}

export const computeGroupsOthers = (commitHistoryByPath: CommitHistoryByPath) => {
  const groups = new Map(commitHistoryByPath)
  groups.delete('.')

  const commitIdsInGroups = new Set<string>()
  for (const commits of groups.values()) {
    for (const commit of commits) {
      commitIdsInGroups.add(commit.commitId)
    }
  }

  const root = commitHistoryByPath.get('.')
  assert(root !== undefined)
  const otherCommits = root.filter((commit) => !commitIdsInGroups.has(commit.commitId))
  return { groups, others: new Map([['Others', otherCommits]]) }
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
