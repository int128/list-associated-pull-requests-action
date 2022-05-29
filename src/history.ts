import * as core from '@actions/core'
import { AssociatedPullRequestsInCommitHistoryOfSubTreeQuery, PullRequestCommitsQuery } from './generated/graphql'

export type ChangeSet = {
  pullOrCommits: Set<string>
  pulls: Set<number>
}

export const findChangeSet = (q: AssociatedPullRequestsInCommitHistoryOfSubTreeQuery, endCommit: string): ChangeSet => {
  if (q.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(q.repository?.object?.__typename)} !== Commit`)
  }

  const pullOrCommits = new Set<string>()
  const pulls = new Set<number>()
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
      pulls.add(pull.number)
    }
  }
  return { pullOrCommits, pulls }
}

export const findChangeSetFromPullRequestCommitsQueryList = (commitsList: PullRequestCommitsQuery[]): ChangeSet => {
  const pullOrCommits = new Set<string>()
  const pulls = new Set<number>()
  for (const commits of commitsList) {
    for (const node of commits.repository?.pullRequest?.commits.nodes ?? []) {
      if (node?.commit.oid === undefined) {
        continue
      }
      if (!node.commit.associatedPullRequests?.nodes?.length) {
        core.info(`${node.commit.oid} -> no pull request`)
        pullOrCommits.add(node.commit.oid)
        continue
      }
      for (const pull of node.commit.associatedPullRequests.nodes) {
        if (pull?.number === undefined) {
          continue
        }
        core.info(`${node.commit.oid} -> #${pull.number}`)
        pullOrCommits.add(`#${pull.number}`)
        pulls.add(pull.number)
      }
    }
  }
  return { pullOrCommits, pulls }
}
