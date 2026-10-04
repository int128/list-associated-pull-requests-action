import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { compareCommits } from './compare.js'
import type { Context } from './github.js'
import { buildOthers, buildPathPullMap, fetchCommitPullMap, type PathPullMap, type PullMap } from './history.js'

type Inputs = {
  pullRequest?: number
  base?: string
  head?: string
  groupByPaths: string[]
  showOthersGroup: boolean
  maxFetchCommits: number | undefined
  maxFetchDays: number | undefined
}

type Commit =
  | { commitId: string }
  | {
      pull: {
        number: number
        title: string
        author: string
      }
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
  core.summary.addHeading('list-associated-pull-requests-action summary', 2)

  const groupByPaths = sanitizePaths(inputs.groupByPaths)
  const { base, head } = await determineBaseHeadFromInputs(inputs, octokit, context)

  core.startGroup(`Compare base ${base} and head ${head}`)
  const pathCommitIdSetMap = await compareCommits(context, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    base,
    head,
    paths: groupByPaths,
    includeRoot: inputs.showOthersGroup,
  })
  core.endGroup()

  const commitIdSet = new Set(pathCommitIdSetMap.values().flatMap((x) => x.values()))
  const commitPullMap = await fetchCommitPullMap(commitIdSet, octokit, context)
  const pathPullMap = buildPathPullMap(pathCommitIdSetMap, commitPullMap)

  if (inputs.showOthersGroup) {
    const others = buildOthers(pathCommitIdSetMap, commitPullMap)
    const nonRootPathPullMap = new Map(pathPullMap)
    nonRootPathPullMap.delete('.')
    writeSummaryOfPathCommitMap(nonRootPathPullMap)
    writeSummaryOfPathCommitMap(new Map([['Others', others]]))
    const bodyGroups = formatCommitHistoryGroups(nonRootPathPullMap)
    const bodyOthers = formatCommitHistoryGroups(new Map([['Others', others]]))
    return {
      body: [bodyGroups, bodyOthers].join('\n').trim(),
      bodyGroups,
      bodyOthers,
      json: {
        groups: Object.fromEntries(nonRootPathPullMap.entries().map(([path, pullMap]) => [path, renderPulls(pullMap)])),
        others: renderPulls(others),
      },
    }
  }

  writeSummaryOfPathCommitMap(pathPullMap)
  const body = formatCommitHistoryGroups(pathPullMap)
  return {
    body,
    bodyGroups: body,
    bodyOthers: '',
    json: {
      groups: Object.fromEntries(
        pathPullMap.entries().map(([path, commitPullMap]) => [path, renderPulls(commitPullMap)]),
      ),
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

const renderPulls = (pullMap: PullMap): Commit[] =>
  pullMap
    .values()
    .map((pullOrCommitId) =>
      typeof pullOrCommitId === 'object' ? { pull: pullOrCommitId } : { commitId: pullOrCommitId },
    )
    .toArray()

const formatCommitHistoryGroups = (pathPullMap: PathPullMap): string => {
  const body = []
  for (const [path, pullMap] of pathPullMap) {
    body.push(`### ${path}`)
    body.push(
      ...pullMap.values().map((pullOrCommitId) => {
        if (typeof pullOrCommitId === 'object') {
          return `- #${pullOrCommitId.number} @${pullOrCommitId.author}`
        }
        return `- ${pullOrCommitId}`
      }),
    )
  }
  return body.join('\n')
}

const writeSummaryOfPathCommitMap = (pathPullMap: PathPullMap) => {
  for (const [path, pullMap] of pathPullMap) {
    core.summary.addHeading(path, 3)
    core.summary.addTable([
      [
        { data: 'Commit', header: true },
        { data: 'Pull Request', header: true },
      ],
      ...pullMap.values().map((pullOrCommitId) => {
        if (typeof pullOrCommitId === 'object') {
          return [`#${pullOrCommitId.number}`, `${pullOrCommitId.title} @${pullOrCommitId.author}`]
        }
        return [`<code>${pullOrCommitId}</code>`, '-']
      }),
    ])
  }
}
