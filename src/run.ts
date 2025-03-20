import * as core from '@actions/core'
import { Context } from './github.js'
import { Octokit } from '@octokit/action'
import { compareCommits } from './compare.js'
import { Commit, CommitHistoryGroups, getCommitHistoryGroups, getCommitHistoryGroupsWithOthers } from './history.js'

type Inputs = {
  pullRequest?: number
  base?: string
  head?: string
  groupByPaths: string[]
  showOthersGroup: boolean
  maxFetchCommits: number | undefined
}

type Outputs = {
  body: string
  bodyGroups: string
  bodyOthers: string
  json: {
    groups: Record<string, Commit[]>
    others: Commit[]
  }
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs> => {
  const groupByPaths = sanitizePaths(inputs.groupByPaths)
  const { base, head } = await determineBaseHeadFromInputs(inputs, octokit, context)

  core.startGroup(`Compare base ${base} and head ${head}`)
  const compare = await compareCommits(octokit, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    base,
    head,
  })
  core.endGroup()

  core.summary.addHeading('list-associated-pull-requests-action summary', 2)
  core.summary.addRaw(`Parsed ${compare.commitIds.size} commits between base ${base} and head ${head}.`)
  core.info(`The earliest commit is ${compare.earliestCommitId} at ${compare.earliestCommitDate.toISOString()}`)

  if (inputs.showOthersGroup) {
    const commitHistoryGroupsWithOthers = await getCommitHistoryGroupsWithOthers(octokit, {
      owner: context.repo.owner,
      name: context.repo.repo,
      expression: head,
      groupByPaths,
      sinceCommitDate: compare.earliestCommitDate,
      sinceCommitId: compare.earliestCommitId,
      filterCommitIds: compare.commitIds,
      maxFetchCommits: inputs.maxFetchCommits,
    })
    writeSummaryOfCommitHistoryGroups(commitHistoryGroupsWithOthers.groups)
    writeSummaryOfCommitHistoryGroups(new Map([['Others', commitHistoryGroupsWithOthers.others]]))
    await core.summary.write()
    const bodyGroups = formatCommitHistoryGroups(commitHistoryGroupsWithOthers.groups)
    const bodyOthers = formatCommitHistoryGroups(new Map([['Others', commitHistoryGroupsWithOthers.others]]))
    return {
      body: [bodyGroups, bodyOthers].join('\n').trim(),
      bodyGroups,
      bodyOthers,
      json: {
        groups: Object.fromEntries(commitHistoryGroupsWithOthers.groups),
        others: commitHistoryGroupsWithOthers.others,
      },
    }
  }

  const commitHistoryGroups = await getCommitHistoryGroups(octokit, {
    owner: context.repo.owner,
    name: context.repo.repo,
    expression: head,
    groupByPaths,
    sinceCommitDate: compare.earliestCommitDate,
    sinceCommitId: compare.earliestCommitId,
    filterCommitIds: compare.commitIds,
    maxFetchCommits: inputs.maxFetchCommits,
  })
  writeSummaryOfCommitHistoryGroups(commitHistoryGroups)
  await core.summary.write()
  const body = formatCommitHistoryGroups(commitHistoryGroups)
  return {
    body,
    bodyGroups: body,
    bodyOthers: '',
    json: {
      groups: Object.fromEntries(commitHistoryGroups),
      others: [],
    },
  }
}

const sanitizePaths = (groupByPaths: string[]) => groupByPaths.filter((p) => p.length > 0 && !p.startsWith('#'))

const determineBaseHeadFromInputs = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  if (inputs.pullRequest) {
    core.info(`Finding the pull request #${inputs.pullRequest}`)
    const { data: pull } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: inputs.pullRequest,
    })
    return { base: pull.base.sha, head: pull.head.sha }
  }
  const { base, head } = inputs
  if (!base || !head) {
    throw new Error('you need to set either pull-request or base/head')
  }
  return { base, head }
}

const formatCommitHistoryGroups = (commitHistoryGroups: CommitHistoryGroups): string => {
  const body = []
  for (const [path, commits] of commitHistoryGroups) {
    body.push(`### ${path}`)
    body.push(
      ...commits.map((commit) => {
        if (commit.pull) {
          return `- #${commit.pull.number} @${commit.pull.author}`
        }
        return `- ${commit.commitId}`
      }),
    )
  }
  return body.join('\n')
}

const writeSummaryOfCommitHistoryGroups = (commitHistoryGroups: CommitHistoryGroups) => {
  for (const [path, commits] of commitHistoryGroups) {
    core.summary.addHeading(path, 3)
    core.summary.addTable([
      [
        { data: 'Commit', header: true },
        { data: 'Pull Request', header: true },
      ],
      ...commits.map((commit) => {
        if (commit.pull) {
          return [commit.commitId, `#${commit.pull.number} ${commit.pull.title} @${commit.pull.author}`]
        }
        return [commit.commitId, '-']
      }),
    ])
  }
}
