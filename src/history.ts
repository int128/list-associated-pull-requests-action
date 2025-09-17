import assert from 'assert'
import * as queue from './queue.js'
import * as getCommitHistory from './queries/getCommitHistory.js'
import { GetCommitHistoryQuery } from './generated/graphql.js'
import { Octokit } from '@octokit/action'

const GRAPHQL_QUERY_CONCURRENCY = 6

export type Commit = {
  commitId: string
  pull?: {
    number: number
    title: string
    author: string
  }
}

export type CommitHistoryGroups = Map<string, Commit[]>

type CommitHistoryGroupsWithOthers = {
  groups: CommitHistoryGroups
  others: Commit[]
}

export const getCommitHistoryGroupsWithOthers = async (
  octokit: Octokit,
  variables: GetCommitHistoryGroupsVariables,
): Promise<CommitHistoryGroupsWithOthers> => {
  const commitHistoryByPath = await getCommitHistoryGroups(octokit, {
    ...variables,
    groupByPaths: ['.', ...variables.groupByPaths],
  })
  return extractOthersFromCommitHistoryGroups(commitHistoryByPath)
}

export const extractOthersFromCommitHistoryGroups = (
  commitHistoryGroups: CommitHistoryGroups,
): CommitHistoryGroupsWithOthers => {
  const groups = new Map(commitHistoryGroups)
  groups.delete('.')

  const commitIdsInGroups = new Set<string>()
  for (const commits of groups.values()) {
    for (const commit of commits) {
      commitIdsInGroups.add(commit.commitId)
    }
  }

  const root = commitHistoryGroups.get('.')
  assert(root !== undefined)
  const others = root.filter((commit) => !commitIdsInGroups.has(commit.commitId))
  return { groups, others }
}

type GetCommitHistoryGroupsVariables = {
  owner: string
  name: string
  expression: string
  groupByPaths: string[]
  sinceCommitDate: Date
  sinceCommitId: string
  filterCommitIds: Set<string>
  maxFetchCommits: number | undefined
}

export const getCommitHistoryGroups = async (
  octokit: Octokit,
  variables: GetCommitHistoryGroupsVariables,
): Promise<CommitHistoryGroups> => {
  const tasks = variables.groupByPaths.map((path) => async () => {
    const query = await getCommitHistory.execute(
      octokit,
      {
        owner: variables.owner,
        name: variables.name,
        expression: variables.expression,
        since: variables.sinceCommitDate,
        path,
        historySize: 100,
      },
      {
        maxFetchCommits: variables.maxFetchCommits,
      },
    )
    return { path, query }
  })
  const results = await queue.execute(GRAPHQL_QUERY_CONCURRENCY, tasks)

  const commitHistoryGroups: CommitHistoryGroups = new Map<string, Commit[]>()
  for (const result of results) {
    const commits = dedupeCommitsByPullRequest(
      parseGetCommitHistoryQuery(result.query, variables.sinceCommitId, variables.filterCommitIds),
    )
    commitHistoryGroups.set(result.path, commits)
  }
  return commitHistoryGroups
}

export const dedupeCommitsByPullRequest = (commits: Commit[]): Commit[] => {
  const deduped = new Map<number | string, Commit>()
  for (const commit of commits) {
    const key = commit.pull?.number ?? commit.commitId
    if (!deduped.has(key)) {
      deduped.set(key, commit)
    }
  }
  return [...deduped.values()]
}

export const parseGetCommitHistoryQuery = (
  q: GetCommitHistoryQuery,
  sinceCommitId: string,
  filterCommitIds: Set<string>,
): Commit[] => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')
  assert(q.repository.object.history.nodes != null)

  const commitNodes = []
  for (const node of q.repository.object.history.nodes) {
    assert(node != null)
    if (!filterCommitIds.has(node.oid)) {
      continue
    }
    commitNodes.push(node)
    if (node.oid === sinceCommitId) {
      break
    }
  }

  const commits: Commit[] = []
  for (const commitNode of commitNodes) {
    if (!commitNode.associatedPullRequests?.nodes?.length) {
      commits.push({
        commitId: commitNode.oid,
      })
      continue
    }
    for (const pull of commitNode.associatedPullRequests.nodes) {
      if (pull?.number === undefined) {
        continue
      }
      commits.push({
        commitId: commitNode.oid,
        pull: {
          number: pull.number,
          title: pull.title,
          author: pull.author?.login ?? '',
        },
      })
    }
  }
  return commits
}
