import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables } from './generated/graphql'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Octokit = InstanceType<typeof GitHub>

export const getPullRequestHistoryOfSubTree = async (
  octokit: Octokit,
  v: AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables,
  excludeCommits: string[]
): Promise<Set<string>> => {
  const history = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, v)
  core.startGroup(`Commit history on ${v.expression} since ${String(v.since)}`)
  core.info(JSON.stringify(history, undefined, 2))
  core.endGroup()
  if (history.repository?.object?.__typename !== 'Commit') {
    throw new Error(`unexpected typename ${String(history.repository?.object?.__typename)} !== Commit`)
  }

  const pullOrCommits = new Set<string>()
  for (const node of history.repository.object.history.nodes ?? []) {
    if (node == null) {
      continue
    }
    if (excludeCommits.indexOf(node.oid) != -1) {
      core.info(`${node.oid} excluded`)
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
