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

  const commitsQueryList = await getPullRequestCommits(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    number: inputs.pullRequest,
  })
  core.startGroup(`Commit of pull request #${inputs.pullRequest}`)
  core.info(JSON.stringify(commitsQueryList, undefined, 2))
  core.endGroup()

  const earliestCommittedDate = findEarliestCommittedDate(commitsQueryList)
  if (earliestCommittedDate === undefined) {
    throw new Error(`internal error: earliestCommittedDate === undefined`)
  }
  core.info(`earliestCommittedDate = ${earliestCommittedDate.toISOString()}`)

  const headRefOid = findHeadRefOid(commitsQueryList)
  if (headRefOid === undefined) {
    throw new Error(`internal error: headRefOid === undefined`)
  }
  core.info(`headRefOid = ${headRefOid}`)

  const historyQueryList = []
  for (const path of inputs.groupBySubPaths) {
    const q = await getCommitHistoryOfSubTree(octokit, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      oid: headRefOid,
      path,
      since: earliestCommittedDate,
    })
    core.startGroup(`Commit history of sub tree: ${path}`)
    core.info(JSON.stringify(q, undefined, 2))
    core.endGroup()
    historyQueryList.push({ path, q })
  }

  const { commitPullsOfPaths, commitPullsOfOthers, associatedPullRequests } = calculate(
    commitsQueryList,
    historyQueryList
  )

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
    associatedPullRequests,
  }
}

export const calculate = (
  commitsQueryList: PullRequestCommitsQuery[],
  historyQueryList: { path: string; q: CommitHistoryOfSubTreeQuery }[]
) => {
  const pullRequestCommits = parsePullRequestCommitsQueryList(commitsQueryList)
  const associatedPullRequests = [...pullRequestCommits.pulls]

  const commitsOfPaths = []
  for (const { path, q } of historyQueryList) {
    const commitIds = parseCommitHistoryOfSubTreeQuery(q)
    commitsOfPaths.push({ path, commitIds })
  }

  const commitPullsOfPaths = []
  for (const { path, commitIds } of commitsOfPaths) {
    const commitPullsOfThisPath = new Map<CommitId, AssociatedPullRequestNumber>()
    for (const commitId of commitIds) {
      const commitPull = pullRequestCommits.commitPulls.get(commitId)
      if (commitPull !== undefined) {
        commitPullsOfThisPath.set(commitId, commitPull)
      }
    }
    if (commitPullsOfThisPath.size > 0) {
      commitPullsOfPaths.push({ path, commitPullsOfThisPath })
    }
  }

  const commitPullsOfOthers = new Map(pullRequestCommits.commitPulls)
  for (const { commitPullsOfThisPath } of commitPullsOfPaths) {
    for (const [oid] of commitPullsOfThisPath) {
      commitPullsOfOthers.delete(oid)
    }
  }

  return { commitPullsOfPaths, commitPullsOfOthers, associatedPullRequests }
}

const findEarliestCommittedDate = (queryList: PullRequestCommitsQuery[]) => {
  let earliestCommittedDate: Date | undefined
  for (const q of queryList) {
    for (const node of q.repository?.pullRequest?.commits?.nodes ?? []) {
      if (node?.commit === undefined) {
        continue
      }
      const committedDate = new Date(node.commit.committedDate)
      if (earliestCommittedDate === undefined || committedDate < earliestCommittedDate) {
        earliestCommittedDate = committedDate
      }
    }
  }
  return earliestCommittedDate
}

const findHeadRefOid = (queryList: PullRequestCommitsQuery[]) => queryList[0].repository?.pullRequest?.headRefOid

type CommitId = string
type AssociatedPullRequestNumber = number | null

type PullRequestCommits = {
  commitPulls: Map<CommitId, AssociatedPullRequestNumber>
  pulls: Set<number>
}

const parsePullRequestCommitsQueryList = (queryList: PullRequestCommitsQuery[]): PullRequestCommits => {
  const commitPulls = new Map<CommitId, AssociatedPullRequestNumber>()
  const pulls = new Set<number>()

  for (const q of queryList) {
    for (const node of q.repository?.pullRequest?.commits?.nodes ?? []) {
      if (node?.commit.oid === undefined) {
        continue
      }
      if (!node.commit.associatedPullRequests?.nodes?.length) {
        core.info(`${node.commit.oid} -> none (${node.commit.committedDate})`)
        commitPulls.set(node.commit.oid, null)
        continue
      }
      for (const pull of node.commit.associatedPullRequests.nodes) {
        if (pull == null) {
          continue
        }
        core.info(`${node.commit.oid} -> #${pull.number} (${node.commit.committedDate})`)
        commitPulls.set(node.commit.oid, pull.number)
        pulls.add(pull.number)
      }
    }
  }
  return { commitPulls, pulls }
}

const parseCommitHistoryOfSubTreeQuery = (q: CommitHistoryOfSubTreeQuery): Set<CommitId> => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`internal error: __typename !== Commit`)
  }
  const commitIds = new Set<CommitId>()
  for (const node of q.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    commitIds.add(node.oid)
  }
  return commitIds
}
