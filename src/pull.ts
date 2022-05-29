import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequestCommitsQuery, CommitHistoryOfSubTreeQuery } from './generated/graphql'
import { getPullRequestCommits } from './queries/pull'
import { getCommitHistoryOfSubTree } from './queries/subtree'

type Inputs = {
  token: string
  pullRequest: number
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

  const octokit = github.getOctokit(inputs.token)

  const commitsList = await getPullRequestCommits(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    number: inputs.pullRequest,
  })
  core.startGroup(`Commit of pull request #${inputs.pullRequest}`)
  core.info(JSON.stringify(commitsList, undefined, 2))
  core.endGroup()

  const pullRequestCommits = parsePullRequestCommitsQueryList(commitsList)
  core.info(`earliestCommittedDate = ${pullRequestCommits.earliestCommittedDate.toISOString()}`)

  const commitsOfPaths = []
  for (const path of inputs.groupBySubPaths) {
    const q = await getCommitHistoryOfSubTree(octokit, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      oid: pullRequestCommits.headRefOid,
      path,
      since: pullRequestCommits.earliestCommittedDate.toISOString(),
    })
    core.startGroup(`Commit history of sub tree: ${path}`)
    core.info(JSON.stringify(q, undefined, 2))
    core.endGroup()
    const commits = parseCommitHistoryOfSubTreeQuery(q)
    commitsOfPaths.push({ path, commits })
  }

  const commitPullsOfPaths = []
  const commitPullsOfOthers = new Map<CommitId, AssociatedPullRequestNumber>([...pullRequestCommits.commitPulls])
  for (const { path, commits } of commitsOfPaths) {
    const commitPullsOfThisPath = new Map<CommitId, AssociatedPullRequestNumber>()
    for (const oid of commits) {
      commitPullsOfOthers.delete(oid)
      const commitPull = pullRequestCommits.commitPulls.get(oid)
      if (commitPull !== undefined) {
        commitPullsOfThisPath.set(path, commitPull)
      }
    }
    if (commitPullsOfThisPath.size > 0) {
      commitPullsOfPaths.push({ path, commitPullsOfThisPath })
    }
  }

  const body = []
  for (const { path, commitPullsOfThisPath } of commitPullsOfPaths) {
    body.push(`### ${path}`)
    for (const [oid, pull] of commitPullsOfThisPath) {
      body.push(`- ${pull ? `#${pull}` : oid}`)
    }
  }
  if (commitPullsOfOthers.size > 0) {
    body.push(`### Others`)
    for (const [oid, pull] of commitPullsOfOthers) {
      body.push(`- ${pull ? `#${pull}` : oid}`)
    }
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...pullRequestCommits.pulls],
  }
}

type CommitId = string
type AssociatedPullRequestNumber = number | null

type PullRequestCommits = {
  commitPulls: Map<CommitId, AssociatedPullRequestNumber>
  pulls: Set<number>
  earliestCommittedDate: Date
  headRefOid: string
}

const parsePullRequestCommitsQueryList = (queryList: PullRequestCommitsQuery[]): PullRequestCommits => {
  const commits = new Map<CommitId, AssociatedPullRequestNumber>()
  const pulls = new Set<number>()
  let earliestCommittedDate: Date | undefined

  const headRefOid = queryList[0].repository?.pullRequest?.headRefOid

  for (const q of queryList) {
    for (const node of q.repository?.pullRequest?.commits?.nodes ?? []) {
      if (node?.commit.oid === undefined) {
        continue
      }
      const committedDate = new Date(node.commit.committedDate)
      if (earliestCommittedDate === undefined || committedDate < earliestCommittedDate) {
        earliestCommittedDate = committedDate
      }
      if (!node.commit.associatedPullRequests?.nodes?.length) {
        core.info(`${node.commit.oid} -> none (${node.commit.committedDate})`)
        commits.set(node.commit.oid, null)
        continue
      }
      for (const pull of node.commit.associatedPullRequests.nodes) {
        if (pull == null) {
          continue
        }
        core.info(`${node.commit.oid} -> #${pull.number} (${node.commit.committedDate})`)
        commits.set(node.commit.oid, pull.number)
        pulls.add(pull.number)
      }
    }
  }

  if (earliestCommittedDate === undefined) {
    throw new Error(`internal error: earliestCommittedDate === undefined`)
  }
  if (headRefOid === undefined) {
    throw new Error(`internal error: headRefOid === undefined`)
  }
  return { commitPulls: commits, pulls, earliestCommittedDate, headRefOid }
}

const parseCommitHistoryOfSubTreeQuery = (q: CommitHistoryOfSubTreeQuery): Set<CommitId> => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`internal error: __typename !== Commit`)
  }
  const commits = new Set<CommitId>()
  for (const node of q.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    commits.add(node.oid)
  }
  return commits
}
