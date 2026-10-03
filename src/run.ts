import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { compareCommits } from './compare.js'
import type { Context } from './github.js'
import {
  buildCommitHistoryGroups,
  type Commit,
  extractOthersFromCommitHistoryGroups,
  type PathCommitMap,
} from './history.js'
import { getCommitPulls } from './queries/getCommitPulls.js'

type Inputs = {
  pullRequest?: number
  base?: string
  head?: string
  groupByPaths: string[]
  showOthersGroup: boolean
  maxFetchCommits: number | undefined
  maxFetchDays: number | undefined
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
  const pathCommitIdsMap = await compareCommits(context, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    base,
    head,
    paths: [...groupByPaths, ...(inputs.showOthersGroup ? ['.'] : [])],
  })
  core.endGroup()

  core.summary.addHeading('list-associated-pull-requests-action summary', 2)

  const commitIdSet = new Set(pathCommitIdsMap.values().flatMap((set) => [...set]))
  const pullsByCommitId = await getCommitPulls(octokit, context.repo.owner, context.repo.repo, commitIdSet)
  const allGroups = buildCommitHistoryGroups(pathCommitIdsMap, pullsByCommitId)

  if (inputs.showOthersGroup) {
    const commitHistoryGroupsWithOthers = extractOthersFromCommitHistoryGroups(allGroups)
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

  const commitHistoryGroups: PathCommitMap = new Map(groupByPaths.map((path) => [path, allGroups.get(path) ?? []]))
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

const formatCommitHistoryGroups = (commitHistoryGroups: PathCommitMap): string => {
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

const writeSummaryOfCommitHistoryGroups = (commitHistoryGroups: PathCommitMap) => {
  for (const [path, commits] of commitHistoryGroups) {
    core.summary.addHeading(path, 3)
    core.summary.addTable([
      [
        { data: 'Commit', header: true },
        { data: 'Pull Request', header: true },
      ],
      ...commits.map((commit) => {
        if (commit.pull) {
          return [
            `<code>${commit.commitId}</code>`,
            `#${commit.pull.number} ${commit.pull.title} @${commit.pull.author}`,
          ]
        }
        return [`<code>${commit.commitId}</code>`, '-']
      }),
    ])
  }
}
