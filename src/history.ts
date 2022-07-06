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
  const q = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.ref,
    path: inputs.path,
    since: inputs.since,
  })
  core.startGroup(
    `AssociatedPullRequestsInCommitHistoryOfSubTreeQuery (${inputs.ref}, ${inputs.path}, ${inputs.since.toISOString()})`
  )
  core.info(JSON.stringify(q, undefined, 2))
  core.endGroup()

  return parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(q, inputs.sinceCommitId)
}

export const parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery = (
  q: AssociatedPullRequestsInCommitHistoryOfSubTreeQuery,
  endCommit: string
): Commit[] => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }

  core.startGroup(`Parse ${q.repository.object.history.totalCount} commit(s)`)
  const commits: Commit[] = []
  for (const node of q.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    if (node.oid === endCommit) {
      core.info(`${node.oid} end`)
      break
    }
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
