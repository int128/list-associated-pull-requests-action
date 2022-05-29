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

  const { commitsOfPathList, commitsOfOthers, associatedPullRequests } = calculate(commitsQueryList, historyQueryList)

  const body = []
  for (const { path, commits } of commitsOfPathList) {
    body.push(`### ${path}`)
    for (const commit of commits) {
      body.push(`- ${commit.pull ? `#${commit.pull}` : commit.commitId}`)
    }
  }
  if (commitsOfOthers.size > 0) {
    body.push(`### Others`)
    for (const commit of commitsOfOthers) {
      body.push(`- ${commit.pull ? `#${commit.pull}` : commit.commitId}`)
    }
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...associatedPullRequests],
  }
}

export const calculate = (
  commitsQueryList: PullRequestCommitsQuery[],
  historyQueryList: { path: string; q: CommitHistoryOfSubTreeQuery }[]
) => {
  const commitsOfPull = parsePullRequestCommitsQueryList(commitsQueryList)

  const commitsOfPathList = []
  for (const { path, q } of historyQueryList) {
    const commitIds = parseCommitHistoryOfSubTreeQuery(q)

    // pick a commit which exists in the pull request
    const commits = []
    for (const commit of commitsOfPull) {
      if (commitIds.has(commit.commitId)) {
        commits.push(commit)
      }
    }
    if (commits.length > 0) {
      commitsOfPathList.push({ path, commits })
    }
  }

  const commitsOfOthersMap = new Map<CommitId, Commit>()
  for (const commit of commitsOfPull) {
    commitsOfOthersMap.set(commit.commitId, commit)
  }
  for (const { commits } of commitsOfPathList) {
    for (const commit of commits) {
      commitsOfOthersMap.delete(commit.commitId)
    }
  }
  const commitsOfOthers = new Set(commitsOfOthersMap.values())

  const associatedPullRequests = new Set<number>()
  for (const { pull } of commitsOfPull) {
    if (pull !== undefined) {
      associatedPullRequests.add(pull)
    }
  }

  return { commitsOfPathList, commitsOfOthers, associatedPullRequests }
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
type Commit = {
  commitId: CommitId
  pull?: number
}

const parsePullRequestCommitsQueryList = (queryList: PullRequestCommitsQuery[]): Commit[] => {
  const commits: Commit[] = []
  for (const q of queryList) {
    for (const node of q.repository?.pullRequest?.commits?.nodes ?? []) {
      if (node?.commit.oid === undefined) {
        continue
      }
      if (!node.commit.associatedPullRequests?.nodes?.length) {
        core.info(`${node.commit.oid} -> none (${node.commit.committedDate})`)
        commits.push({ commitId: node.commit.oid })
        continue
      }
      for (const pull of node.commit.associatedPullRequests.nodes) {
        if (pull == null) {
          continue
        }
        core.info(`${node.commit.oid} -> #${pull.number} (${node.commit.committedDate})`)
        commits.push({ commitId: node.commit.oid, pull: pull.number })
      }
    }
  }
  return commits
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
