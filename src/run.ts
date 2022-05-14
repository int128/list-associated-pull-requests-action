import * as core from '@actions/core'
import * as github from '@actions/github'
import { Association, findAssociation } from './history'
import { getCommit } from './queries/commit'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Inputs = {
  token: string
  base: string
  head: string
  path: string
  groupBySubPaths: string[]
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

  const association = findAssociation(history, baseCommit.repository.object.oid)
  if (inputs.groupBySubPaths.length === 0) {
    return {
      body: [...association.pullOrCommits].map((s) => `- ${s}`).join('\n'),
      associatedPullRequests: [...association.pulls],
      pullRequestListMarkdown: [...association.pulls].map((s) => `- #${s}`).join('\n'),
    }
  }

  const subPathAssociations = new Map<string, Association>()
  for (const subPath of inputs.groupBySubPaths) {
    const history = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      expression: inputs.head,
      path: subPath,
      since: baseCommit.repository.object.committedDate,
    })
    core.startGroup(`Commit history of subpath ${subPath}`)
    core.info(JSON.stringify(history, undefined, 2))
    core.endGroup()
    const association = findAssociation(history, baseCommit.repository.object.oid)
    subPathAssociations.set(subPath, association)
  }

  const others = new Set(association.pullOrCommits)
  const body = []
  for (const [subPath, association] of subPathAssociations) {
    body.push(`### ${subPath}`)
    for (const pullOrCommit of association.pullOrCommits) {
      body.push(`- ${pullOrCommit}`)
      others.delete(pullOrCommit)
    }
  }
  body.push(`### Others`)
  for (const pullOrCommit of others) {
    body.push(`- ${pullOrCommit}`)
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...association.pulls],
    pullRequestListMarkdown: [...association.pulls].map((s) => `- #${s}`).join('\n'),
  }
}
