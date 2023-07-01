import * as core from '@actions/core'
import * as github from '@actions/github'
import { Commit } from './history'
import { listAssociatedPullRequests } from './list'

type Inputs = {
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

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)
  const groupByPaths = sanitizePaths(inputs.groupByPaths)

  let { base, head } = inputs
  if (inputs.pullRequest) {
    const { data: pull } = await octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: inputs.pullRequest,
    })
    core.info(`Found #${pull.number}`)
    base = pull.base.sha
    head = pull.head.sha
  }
  if (!base || !head) {
    throw new Error('you need to set either pull-request or base/head')
  }
  core.info(`base = ${base}`)
  core.info(`head = ${head}`)

  const associatedPulls = await listAssociatedPullRequests(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base,
    head,
    showOthersGroup: inputs.showOthersGroup,
    groupByPaths,
  })

  const bodyGroups = []
  for (const [path, commits] of associatedPulls.commitsByPath) {
    bodyGroups.push(`### ${path}`)
    bodyGroups.push(...formatCommits(commits))
  }
  const bodyOthers = []
  if (associatedPulls.others) {
    bodyOthers.push(`### Others`)
    bodyOthers.push(...formatCommits(associatedPulls.others))
  }
  return {
    body: [...bodyGroups, ...bodyOthers].join('\n'),
    bodyGroups: bodyGroups.join('\n'),
    bodyOthers: bodyOthers.join('\n'),
  }
}

const sanitizePaths = (groupByPaths: string[]) => groupByPaths.filter((p) => p.length > 0 && !p.startsWith('#'))

const formatCommits = (commits: Commit[]): string[] => [
  ...new Set(
    commits.map((commit) => {
      if (commit.pull) {
        return `- #${commit.pull.number} @${commit.pull.author}`
      }
      return `- ${commit.commitId}`
    })
  ),
]
