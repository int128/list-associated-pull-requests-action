import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { GetCommitHistoryQuery } from './generated/graphql'
import { getCommitHistory } from './queries/getCommitHistory'

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

export const paginateCommitHistory = async (octokit: Octokit, inputs: Inputs): Promise<Commit[]> => {
  const commits: Commit[] = []
  for (let afterCursor: string | undefined; ; ) {
    const q = await getCommitHistory(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.ref,
      path: inputs.path,
      since: inputs.since,
      historySize: 100,
      historyAfter: afterCursor,
    })
    core.startGroup(`GetCommitHistoryQuery(${inputs.path})`)
    const page = parseGetCommitHistoryQuery(q, inputs.sinceCommitId)
    core.endGroup()
    commits.push(...page.commits)
    if (page.hasNextPage === false) {
      break
    }
    afterCursor = page.endCursor
  }
  return commits
}

type Page = {
  commits: Commit[]
  hasNextPage: boolean
  endCursor?: string
}

export const parseGetCommitHistoryQuery = (q: GetCommitHistoryQuery, sinceCommitId: string): Page => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected q.repository.object.__typename: ${JSON.stringify(q, undefined, 2)}`)
  }

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
  return {
    commits,
    hasNextPage: q.repository.object.history.pageInfo.hasNextPage,
    endCursor: q.repository.object.history.pageInfo.endCursor ?? undefined,
  }
}

const filterNodes = (q: GetCommitHistoryQuery, sinceCommitId: string) => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected q.repository.object.__typename: ${JSON.stringify(q, undefined, 2)}`)
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
