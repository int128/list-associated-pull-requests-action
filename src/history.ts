import * as core from '@actions/core'
import { AssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './generated/graphql'

export const parseHistory = (
  q: AssociatedPullRequestsInCommitHistoryOfSubTreeQuery,
  endCommit: string
): Set<string> => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }

  const pullOrCommits = new Set<string>()
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
      pullOrCommits.add(node.oid)
      continue
    }
    for (const pull of node.associatedPullRequests.nodes) {
      if (pull?.number === undefined) {
        continue
      }
      core.info(`${node.oid} -> #${pull.number}`)
      pullOrCommits.add(`#${pull.number}`)
    }
  }
  return pullOrCommits
}
