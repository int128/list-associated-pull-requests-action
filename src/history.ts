import assert from 'assert'
import * as getCommitHistory from './queries/getCommitHistory'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from './generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const getCommitHistoryQuery = async (
  octokit: Octokit,
  v: GetCommitHistoryQueryVariables,
): Promise<GetCommitHistoryQuery> =>
  await getCommitHistory.paginate(getCommitHistory.withRetry(getCommitHistory.withOctokit(octokit)), v)

type Inputs = Pick<GetCommitHistoryQueryVariables, 'owner' | 'name' | 'expression'> & {
  groupByPaths: string[]
  sinceCommitDate: Date
  sinceCommitId: string
  filterCommitIds: Set<string>
}

export type Commit = {
  commitId: string
  pull?: {
    number: number
    author: string
  }
}

export type CommitHistoryByPath = Map<string, Commit[]>

export const getCommitHistoryByPath = async (octokit: Octokit, inputs: Inputs): Promise<CommitHistoryByPath> => {
  const results = await Promise.all(
    inputs.groupByPaths.map(async (groupByPath) => {
      const variables: GetCommitHistoryQueryVariables = {
        owner: inputs.owner,
        name: inputs.name,
        expression: inputs.expression,
        since: inputs.sinceCommitDate,
        path: groupByPath,
        historySize: 100,
      }
      const query = await getCommitHistoryQuery(octokit, variables)
      return { variables, query }
    }),
  )

  const commitHistoryByPath = new Map<string, Commit[]>()
  for (const result of results) {
    const groupByPath = result.variables.path
    const commits = parseGetCommitHistoryQuery(result.query, inputs.sinceCommitId, inputs.filterCommitIds)
    commitHistoryByPath.set(groupByPath, commits)
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
