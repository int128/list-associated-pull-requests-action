import * as core from '@actions/core'
import { AssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './generated/graphql'

type CommitId = string

export type Commit = {
  commitId: CommitId
  pull?: {
    number: number
    author: string
  }
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
