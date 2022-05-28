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

  const subPathCommits = new Map<string, Set<string>>()
  for (const subPath of inputs.groupBySubPaths) {
    const q = await getCommitHistoryOfSubTree(octokit, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      oid: pullRequestCommits.headRefOid,
      path: subPath,
      since: pullRequestCommits.earliestCommittedDate.toISOString(),
    })
    core.startGroup(`Commit history of sub tree: ${subPath}`)
    core.info(JSON.stringify(q, undefined, 2))
    core.endGroup()
    const commits = parseCommitHistoryOfSubTreeQuery(q)
    subPathCommits.set(subPath, commits)
  }

  const subPathCommitMetadatas = new Map<string, Map<string, CommitMetadata>>()
  const otherCommitMetadatas = new Map(pullRequestCommits.commitMetadatas)
  for (const [subPath, oids] of subPathCommits) {
    const commitMetadataInSubPath = new Map<string, CommitMetadata>()
    for (const oid of oids) {
      otherCommitMetadatas.delete(oid)
      const commitMetadata = pullRequestCommits.commitMetadatas.get(oid)
      if (commitMetadata !== undefined) {
        commitMetadataInSubPath.set(subPath, commitMetadata)
      }
    }
    if (commitMetadataInSubPath.size > 0) {
      subPathCommitMetadatas.set(subPath, commitMetadataInSubPath)
    }
  }

  const body = []
  for (const [subPath, metadataMap] of subPathCommitMetadatas) {
    body.push(`### ${subPath}`)
    for (const [oid, metadata] of metadataMap) {
      body.push(metadata.pull ? `#${metadata.pull}` : oid)
    }
  }
  if (otherCommitMetadatas.size > 0) {
    body.push(`### Others`)
    for (const [oid, metadata] of otherCommitMetadatas) {
      body.push(metadata.pull ? `#${metadata.pull}` : oid)
    }
  }

  return {
    body: body.join('\n'),
    associatedPullRequests: [...pullRequestCommits.pulls],
  }
}

type CommitMetadata = {
  pull?: number
}

type PullRequestCommits = {
  commitMetadatas: Map<string, CommitMetadata>
  pulls: Set<number>
  earliestCommittedDate: Date
  headRefOid: string
}

const parsePullRequestCommitsQueryList = (queryList: PullRequestCommitsQuery[]): PullRequestCommits => {
  const commits = new Map<string, CommitMetadata>()
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
        core.info(`${node.commit.oid} -> no pull request`)
        commits.set(node.commit.oid, {})
        continue
      }
      for (const pull of node.commit.associatedPullRequests.nodes) {
        if (pull == null) {
          continue
        }
        core.info(`${node.commit.oid} -> #${pull.number}`)
        commits.set(node.commit.oid, { pull: pull.number })
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
  return { commitMetadatas: commits, pulls, earliestCommittedDate, headRefOid }
}

const parseCommitHistoryOfSubTreeQuery = (q: CommitHistoryOfSubTreeQuery): Set<string> => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`internal error: __typename !== Commit`)
  }
  const commits = new Set<string>()
  for (const node of q.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    commits.add(node.oid)
  }
  return commits
}
