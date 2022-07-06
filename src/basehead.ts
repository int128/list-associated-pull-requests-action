import * as core from '@actions/core'
import * as github from '@actions/github'
import { compareCommits } from './compare'
import { Commit, getCommitHistory } from './history'

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

  core.info(`Compare ${inputs.base} and ${inputs.head}`)
  const compare = await compareCommits(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`commits = ${compare.commitIds.size}`)
  core.info(`earliestCommit = ${compare.earliestCommitId} (${compare.earliestCommitDate.toISOString()})`)

  const subTreeCommits = []
  for (const path of inputs.groupByPaths) {
    const commitHistory = await getCommitHistory(octokit, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: inputs.head,
      path,
      since: compare.earliestCommitDate,
      sinceCommitId: compare.earliestCommitId,
    })
    const commits = commitHistory.filter((commit) => compare.commitIds.has(commit.commitId))
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

  const rootCommitHistory = await getCommitHistory(octokit, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    ref: inputs.head,
    path: '.',
    since: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
  })
  const rootCommits = rootCommitHistory.filter((commit) => compare.commitIds.has(commit.commitId))

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
