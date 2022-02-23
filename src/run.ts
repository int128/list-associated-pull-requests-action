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
  body: string
  associatedPullRequests: number[]
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

  const history = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.head,
    path: inputs.path,
    since: baseCommit.repository.object.committedDate,
  })
  core.startGroup(`Commit history on ${inputs.head} since ${baseCommit.repository.object.committedDate}`)
  core.info(JSON.stringify(history, undefined, 2))
  core.endGroup()
  if (history.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(history.repository?.object?.__typename)} !== Commit`)
  }

  const pulls = new Set<number>()
  const body: string[] = []
  for (const node of history.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    if (node.oid === baseCommit.repository.object.oid) {
      core.info(`${node.oid} base`)
      break
    }
    if (!node.associatedPullRequests?.nodes?.length) {
      core.info(`${node.oid} -> none`)
      body.push(`- ${node.oid}`)
      continue
    }
    for (const pull of node.associatedPullRequests.nodes) {
      if (pull?.number === undefined) {
        continue
      }
      core.info(`${node.oid} -> #${pull.number}`)
      if (!pulls.has(pull.number)) {
        pulls.add(pull.number)
        body.push(`- #${pull.number}`)
      }
    }
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...pulls],
    pullRequestListMarkdown: [...pulls].map((n) => `- #${n}`).join('\n'),
  }
}
