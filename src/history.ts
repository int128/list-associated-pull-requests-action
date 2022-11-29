import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { AssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './generated/graphql'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  ref: string
  path: string
  since: Date
  sinceCommitId: string
}

export type Commit = {
  commitId: string
  pull?: {
    number: number
    author: string
  }
}

export const getCommitHistory = async (octokit: Octokit, inputs: Inputs): Promise<Commit[]> => {
  const commits: Commit[] = []
  for (let afterCursor: string | undefined; ; ) {
    const page = await getCommitHistoryByCursor(octokit, inputs, afterCursor)
    commits.push(...page.commits)
    if (page.hasNextPage === false) {
      break
    }
    afterCursor = page.endCursor
  }
  return commits
}

type CommitHistoryPage = {
  commits: Commit[]
  hasNextPage: boolean
  endCursor?: string
}

const getCommitHistoryByCursor = async (
  octokit: Octokit,
  inputs: Inputs,
  afterCursor?: string
): Promise<CommitHistoryPage> => {
  core.startGroup(
    `AssociatedPullRequestsInCommitHistoryOfSubTreeQuery (${inputs.ref}, ${inputs.path}, ${inputs.since.toISOString()})`
  )
  const q = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.ref,
    path: inputs.path,
    since: inputs.since,
    after: afterCursor,
  })
  core.info(JSON.stringify(q, undefined, 2))
  core.endGroup()

  return parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(q, inputs.sinceCommitId)
}

export const parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery = (
  q: AssociatedPullRequestsInCommitHistoryOfSubTreeQuery,
  sinceCommitId: string
): CommitHistoryPage => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }

  const nodes = filterNodes(q, sinceCommitId)
  core.startGroup(`Found ${nodes.length} commit(s)`)
  const commits: Commit[] = []
  for (const node of nodes) {
    if (!node.associatedPullRequests?.nodes?.length) {
      core.info(`${node.oid} -> no pull request`)
      commits.push({ commitId: node.oid })
      continue
    }
    for (const pull of node.associatedPullRequests.nodes) {
      if (pull?.number === undefined) {
        continue
      }
      core.info(`${node.oid} -> #${pull.number}`)
      commits.push({
        commitId: node.oid,
        pull: {
          number: pull.number,
          author: pull.author?.login ?? '',
        },
      })
    }
  }
  core.endGroup()

  return {
    commits,
    hasNextPage: q.repository.object.history.pageInfo.hasNextPage,
    endCursor: q.repository.object.history.pageInfo.endCursor ?? undefined,
  }
}

const filterNodes = (q: AssociatedPullRequestsInCommitHistoryOfSubTreeQuery, sinceCommitId: string) => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }
  const nodes = []
  for (const node of q.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    nodes.push(node)
    if (node.oid === sinceCommitId) {
      break
    }
  }
  return nodes
}
