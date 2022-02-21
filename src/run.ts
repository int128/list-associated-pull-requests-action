import * as core from '@actions/core'
import * as github from '@actions/github'
import { getCommit } from './queries/commit'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Inputs = {
  token: string
  base: string
  head: string
  path: string
}

type Outputs = {
  pullRequestNumberList: string
  pullRequestNumberListMarkdown: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  const baseCommit = await getCommit(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.base,
  })
  core.info(`baseCommit = ${JSON.stringify(baseCommit, undefined, 2)}`)
  if (baseCommit.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(baseCommit.repository?.object?.__typename)} !== Commit`)
  }

  const history = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.head,
    path: inputs.path,
    since: baseCommit.repository.object.committedDate,
  })
  core.info(`history = ${JSON.stringify(history, undefined, 2)}`)
  if (history.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(history.repository?.object?.__typename)} !== Commit`)
  }

  const pulls = new Set<number>()
  for (const node of history.repository.object.history.nodes ?? []) {
    for (const pull of node?.associatedPullRequests?.nodes ?? []) {
      if (pull?.number) {
        pulls.add(pull.number)
      }
    }
  }

  return {
    pullRequestNumberList: [...pulls].join('\n'),
    pullRequestNumberListMarkdown: [...pulls].map((n) => `- #${n}`).join('\n'),
  }
}
