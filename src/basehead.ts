import * as core from '@actions/core'
import * as github from '@actions/github'
import { Commit, parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './history'
import { getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery } from './queries/history'

type Inputs = {
  token: string
  base: string
  head: string
  groupByPaths: string[]
  showOthersGroup: boolean
}

type Outputs = {
  body: string
}

export const computeChangeSetBetweenBaseHead = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  // https://stackoverflow.com/a/27543067
  core.info(`Compare ${inputs.base} and ${inputs.head}`)
  const { data: compare } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    basehead: `${inputs.base}...${inputs.head}`,
  })
  const mergeBaseCommitOID = compare.merge_base_commit.sha
  const mergeBaseCommitDate = compare.merge_base_commit.commit.committer?.date
  if (mergeBaseCommitDate === undefined) {
    throw new Error(`could not get the timestamp of merge base commit`)
  }
  core.info(`mergeBaseCommit = ${mergeBaseCommitOID} (${mergeBaseCommitDate})`)

  const subTreeCommits = []
  for (const path of inputs.groupByPaths) {
    const history = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      expression: inputs.head,
      path,
      since: mergeBaseCommitDate,
    })
    core.startGroup(`Query (${path}, ${inputs.head}, ${mergeBaseCommitDate})`)
    core.info(JSON.stringify(history, undefined, 2))
    core.endGroup()
    const commits = parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(history, mergeBaseCommitOID)
    subTreeCommits.push({ path, commits })
  }

  const body = []
  for (const { path, commits } of subTreeCommits) {
    body.push(`### ${path}`)
    body.push(...formatCommits(commits))
  }
  if (!inputs.showOthersGroup) {
    return { body: body.join('\n') }
  }

  const rootHistory = await getAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.head,
    path: '.',
    since: mergeBaseCommitDate,
  })
  core.startGroup(`Query (${inputs.head}, ${mergeBaseCommitDate})`)
  core.info(JSON.stringify(rootHistory, undefined, 2))
  core.endGroup()
  const rootCommits = parseAssociatedPullRequestsInCommitHistoryOfSubTreeQuery(rootHistory, mergeBaseCommitOID)

  const otherCommits = new Map<string, Commit>()
  for (const commit of rootCommits) {
    otherCommits.set(commit.commitId, commit)
  }
  for (const { commits } of subTreeCommits) {
    for (const commit of commits) {
      otherCommits.delete(commit.commitId)
    }
  }
  body.push(`### Others`)
  body.push(...formatCommits([...otherCommits.values()]))

  return {
    body: body.join('\n'),
  }
}

const formatCommits = (commits: Commit[]): string[] => [
  ...new Set(
    commits.map((commit) => {
      if (commit.pull) {
        return `- #${commit.pull.number} @${commit.pull.author}`
      }
      return `- ${commit.commitId}`
    })
  ),
]
