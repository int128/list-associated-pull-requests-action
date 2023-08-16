import assert from 'assert'
import * as getCommitHistory from './queries/getCommitHistory'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from './generated/graphql'

type Octokit = InstanceType<typeof GitHub>

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
      const query = await getCommitHistoryQuery(octokit, {
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

const getCommitHistoryQuery = async (
  octokit: Octokit,
  v: GetCommitHistoryQueryVariables,
): Promise<GetCommitHistoryQuery> =>
  await getCommitHistory.paginate(getCommitHistory.withRetry(getCommitHistory.withOctokit(octokit)), v)

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
