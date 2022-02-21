import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { getCommit } from './queries/commit'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  token: string
  base: string
  head: string
  path: string
  pullRequest: boolean
  pullRequestTitle: string
}

type Outputs = {
  pullRequestList: string
  pullRequestListMarkdown: string
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
  for (const node of history.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    if (node.oid === baseCommit.repository.object.oid) {
      core.info(`${node.oid} base`)
      break
    }
    for (const pull of node?.associatedPullRequests?.nodes ?? []) {
      if (pull?.number) {
        core.info(`${node.oid} -> #${pull.number}`)
        pulls.add(pull.number)
      }
    }
  }
  const pullRequestList = [...pulls].join('\n')
  const pullRequestListMarkdown = [...pulls].map((n) => `- #${n}`).join('\n')

  if (inputs.pullRequest) {
    await createPullRequest(octokit, inputs, pullRequestListMarkdown)
  }

  return {
    pullRequestList,
    pullRequestListMarkdown,
  }
}

const createPullRequest = async (octokit: Octokit, inputs: Inputs, pullRequestListMarkdown: string) => {
  const base = inputs.base.replace('refs/heads/', '')
  const head = inputs.head.replace('refs/heads/', '')

  core.info(`Creating a pull request from ${head} into ${base}`)
  const { data: pull } = await octokit.rest.pulls.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base,
    head,
    title: inputs.pullRequestTitle ?? undefined,
    body: pullRequestListMarkdown,
  })
  core.info(`Created ${pull.html_url}`)

  core.info(`Adding ${github.context.actor} to assignees`)
  await octokit.rest.issues.addAssignees({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pull.number,
    assignees: [github.context.actor],
  })

  return pull.number
}
