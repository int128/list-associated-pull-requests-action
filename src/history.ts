import assert from 'assert'
import * as getCommitHistory from './queries/getCommitHistory.js'
import { GetCommitHistoryQuery } from './generated/graphql.js'
import { Octokit } from '@octokit/action'

export type CommitHistoryByPath = Map<string, Commit[]>

export type Commit = {
  commitId: string
  pull?: {
    number: number
    author: string
  }
}

type GetCommitHistoryByPathVariables = {
  owner: string
  name: string
  expression: string
  groupByPaths: string[]
  sinceCommitDate: Date
  sinceCommitId: string
  filterCommitIds: Set<string>
}

export const getCommitHistoryByPath = async (
  octokit: Octokit,
  variables: GetCommitHistoryByPathVariables,
): Promise<CommitHistoryByPath> => {
  const results = await Promise.all(
    variables.groupByPaths.map(async (path) => {
      const query = await getCommitHistory.execute(octokit, {
        owner: variables.owner,
        name: variables.name,
        expression: variables.expression,
        since: variables.sinceCommitDate,
        path,
        historySize: 100,
      })
      return { path, query }
    }),
  )

  const commitHistoryByPath = new Map<string, Commit[]>()
  for (const result of results) {
    const commits = parseGetCommitHistoryQuery(result.query, variables.sinceCommitId, variables.filterCommitIds)
    commitHistoryByPath.set(result.path, commits)
  }
  return commitHistoryByPath
}

export const parseGetCommitHistoryQuery = (
  q: GetCommitHistoryQuery,
  sinceCommitId: string,
  filterCommitIds: Set<string>,
): Commit[] => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')

  const nodes = filterNodes(q, sinceCommitId, filterCommitIds)
  const commits: Commit[] = []
  for (const node of nodes) {
    if (!node.associatedPullRequests?.nodes?.length) {
      commits.push({ commitId: node.oid })
      continue
    }
    for (const pull of node.associatedPullRequests.nodes) {
      if (pull?.number === undefined) {
        continue
      }
      commits.push({
        commitId: node.oid,
        pull: {
          number: pull.number,
          author: pull.author?.login ?? '',
        },
      })
    }
  }
  return commits
}

const filterNodes = (q: GetCommitHistoryQuery, sinceCommitId: string, filterCommitIds: Set<string>) => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')
  assert(q.repository.object.history.nodes != null)

  const nodes = []
  for (const node of q.repository.object.history.nodes) {
    assert(node != null)

    if (!filterCommitIds.has(node.oid)) {
      continue
    }
    nodes.push(node)
    if (node.oid === sinceCommitId) {
      break
    }
  }
  return nodes
}

type CommitHistoryGroupsAndOthers = {
  groups: CommitHistoryByPath
  others: Commit[]
}

export const getCommitHistoryGroupsAndOthers = async (
  octokit: Octokit,
  variables: GetCommitHistoryByPathVariables,
): Promise<CommitHistoryGroupsAndOthers> => {
  const commitHistoryByPath = await getCommitHistoryByPath(octokit, {
    ...variables,
    groupByPaths: ['.', ...variables.groupByPaths],
  })
  return computeGroupsAndOthers(commitHistoryByPath)
}

export const computeGroupsAndOthers = (commitHistoryByPath: CommitHistoryByPath): CommitHistoryGroupsAndOthers => {
  const groups = new Map(commitHistoryByPath)
  groups.delete('.')

  const commitIdsInGroups = new Set<string>()
  for (const commits of groups.values()) {
    for (const commit of commits) {
      commitIdsInGroups.add(commit.commitId)
    }
  }

  const root = commitHistoryByPath.get('.')
  assert(root !== undefined)
  const others = root.filter((commit) => !commitIdsInGroups.has(commit.commitId))
  return { groups, others }
}
