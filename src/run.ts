import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPullRequestHistoryOfSubTree } from './history'
import { getCommit } from './queries/commit'

type Inputs = {
  token: string
  base: string
  head: string
  path: string
}

type Outputs = {
  body: string
  associatedPullRequests: string[]
  pullRequestListMarkdown: string // deprecated
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  const baseCommit = await getCommit(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.base,
  })
  core.startGroup(`Base commit of ${inputs.base}`)
  core.info(JSON.stringify(baseCommit, undefined, 2))
  core.endGroup()
  if (baseCommit.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(baseCommit.repository?.object?.__typename)} !== Commit`)
  }

  const pullOrCommits = await getPullRequestHistoryOfSubTree(
    octokit,
    {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      expression: inputs.head,
      path: inputs.path,
      since: baseCommit.repository.object.committedDate,
    },
    baseCommit.repository.object.oid
  )

  const pulls = []
  const body = []
  for (const pullOrCommit of pullOrCommits) {
    if (pullOrCommit.startsWith('#')) {
      pulls.push(pullOrCommit.substring(1))
    }
    body.push(`- ${pullOrCommit}`)
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...pulls],
    pullRequestListMarkdown: [...pulls].map((n) => `- #${n}`).join('\n'),
  }
}
