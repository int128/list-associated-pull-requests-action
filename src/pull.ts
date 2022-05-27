import * as core from '@actions/core'
import * as github from '@actions/github'
import { findChangeSetFromPullRequestCommitsQueryList } from './history'
import { getPullRequestCommits } from './queries/pull'

type Inputs = {
  token: string
  pullRequest: number
  path: string
  groupBySubPaths: string[]
}

type Outputs = {
  body: string
  associatedPullRequests: number[]
}

export const computeChangeSetOfPullRequest = async (inputs: Inputs): Promise<Outputs> => {
  if (inputs.groupBySubPaths.length > 0) {
    core.warning(`group-by-sub-paths is not yet supported for pull-request`)
  }
  if (inputs.path !== '.') {
    core.warning(`path is not yet supported for pull-request`)
  }

  const octokit = github.getOctokit(inputs.token)

  const commitsList = await getPullRequestCommits(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    number: inputs.pullRequest,
  })
  core.startGroup(`Commit of pull request #${inputs.pullRequest}`)
  core.info(JSON.stringify(commitsList, undefined, 2))
  core.endGroup()
  const changeSet = findChangeSetFromPullRequestCommitsQueryList(commitsList)

  return {
    body: [...changeSet.pullOrCommits].map((s) => `- ${s}`).join('\n'),
    associatedPullRequests: [...changeSet.pulls],
  }
}
