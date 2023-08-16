import assert from 'assert'
import * as core from '@actions/core'
import * as getCommitHistoryQuery from './queries/getCommitHistory'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery } from './generated/graphql'

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
  const commitHistory = await getCommitHistoryQuery.paginate(
    getCommitHistoryQuery.withRetry(getCommitHistoryQuery.withOctokit(octokit)),
    {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.ref,
      path: inputs.path,
      since: inputs.since,
      historySize: 100,
    },
  )
  return parseGetCommitHistoryQuery(commitHistory, inputs.sinceCommitId)
}

export const parseGetCommitHistoryQuery = (q: GetCommitHistoryQuery, sinceCommitId: string): Commit[] => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')

  const nodes = filterNodes(q, sinceCommitId)
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
  return commits
}

const filterNodes = (q: GetCommitHistoryQuery, sinceCommitId: string) => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')

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
