import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequestCommitsQuery } from './generated/graphql'
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

  const commits = parsePullRequestCommitsQueryList(commitsList)
  const associatedPullRequests = []
  for (const c of commits) {
    if (c.pull !== undefined) {
      associatedPullRequests.push(c.pull)
    }
  }

  return {
    body: commits.map((c) => `- ${c.pull !== undefined ? `#${c.pull}` : c.oid}`).join('\n'),
    associatedPullRequests,
  }
}

type Commit = {
  oid: string
  pull?: number
}

const parsePullRequestCommitsQueryList = (commitsList: PullRequestCommitsQuery[]): Commit[] => {
  const parsedCommits = []
  for (const commits of commitsList) {
    for (const node of commits.repository?.pullRequest?.commits.nodes ?? []) {
      if (node?.commit.oid === undefined) {
        continue
      }
      const associatedPullRequest = node.commit.associatedPullRequests?.nodes?.find((node) => node)
      if (associatedPullRequest) {
        core.info(`${node.commit.oid} -> #${associatedPullRequest.number}`)
        parsedCommits.push({
          oid: node.commit.oid,
          pull: associatedPullRequest.number,
        })
        continue
      }
      core.info(`${node.commit.oid} -> no pull request`)
      parsedCommits.push({
        oid: node.commit.oid,
      })
    }
  }
  return parsedCommits
}
