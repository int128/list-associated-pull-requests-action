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
    base = pull.base.ref
    head = pull.head.ref
  }
  if (!base || !head) {
    throw new Error('you need to set either pull-request or base/head')
  }

  const associatedPulls = await listAssociatedPullRequests(octokit, {
    base,
    head,
    showOthersGroup: inputs.showOthersGroup,
    groupByPaths,
  })
  const body = []
  for (const [path, commits] of associatedPulls.commitsByPath) {
    body.push(`### ${path}`)
    body.push(...formatCommits(commits))
  }
  if (associatedPulls.others) {
    body.push(`### Others`)
    body.push(...formatCommits(associatedPulls.others))
  }
  return { body: body.join('\n') }
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
