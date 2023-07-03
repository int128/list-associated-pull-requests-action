import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { CommitHistoryOfSubTreeQuery } from './generated/graphql'
import { findCommitHistoryOfSubTreeQuery } from './queries/history'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  ref: string
  path: string
  since: Date
  sinceCommitId: string
}

type CommitId = string

export const findCommitHistoryOfSubTree = async (octokit: Octokit, inputs: Inputs): Promise<CommitId[]> => {
  const commits: CommitId[] = []
  for (let afterCursor: string | undefined; ; ) {
    core.info(`findCommitHistoryOfSubTreeQuery()`)
    const q = await findCommitHistoryOfSubTreeQuery(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.ref,
      path: inputs.path,
      since: inputs.since,
      historySize: 100,
      historyAfter: afterCursor,
    })
    const page = parseCommitHistoryOfSubTreeQuery(q, inputs.sinceCommitId)
    commits.push(...page.commits)
    if (page.hasNextPage === false) {
      break
    }
    afterCursor = page.endCursor
  }
  return commits
}

type Page = {
  commits: CommitId[]
  hasNextPage: boolean
  endCursor?: string
}

export const parseCommitHistoryOfSubTreeQuery = (q: CommitHistoryOfSubTreeQuery, sinceCommitId: string): Page => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }
  const nodes = filterHistoryNodesSince(q, sinceCommitId)
  const commits: CommitId[] = nodes.map((node) => node.oid)
  return {
    commits,
    hasNextPage: q.repository.object.history.pageInfo.hasNextPage,
    endCursor: q.repository.object.history.pageInfo.endCursor ?? undefined,
  }
}

const filterHistoryNodesSince = (q: CommitHistoryOfSubTreeQuery, sinceCommitId: string) => {
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
