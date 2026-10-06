import { mkdtemp } from 'node:fs/promises'
import path from 'node:path'
import * as core from '@actions/core'
import * as git from './git.js'
import type { Context } from './github.js'

type Inputs = {
  owner: string
  repo: string
  base: string
  head: string
  paths: string[]
  includeRoot: boolean
}

export type PathCommitIdSetMap = ReadonlyMap<string, Set<string>>

export const compareCommits = async (context: Context, inputs: Inputs): Promise<PathCommitIdSetMap> => {
  const paths = [...inputs.paths]
  if (inputs.includeRoot) {
    paths.push('.')
  }

  const workspace = await mkdtemp(path.join(context.runnerTemp, `${inputs.owner}-${inputs.repo}-`))
  await git.init(workspace)
  await fetchCommitsBetweenBaseHead(context, workspace, inputs.base, inputs.head)

  const baseHeadCommitIdSet = await git.getCommitIdSetBetweenBaseHead({
    cwd: workspace,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`Total ${baseHeadCommitIdSet.size} commits between base and head`)
  if (baseHeadCommitIdSet.size === 0) {
    return new Map(paths.map((path) => [path, new Set<string>()]))
  }

  const oldestCommitTimestamp = await git.getOldestCommitTimestampBetweenBaseHead({
    cwd: workspace,
    base: inputs.base,
    head: inputs.head,
  })
  core.info(`The oldest commit is at ${formatTimestamp(oldestCommitTimestamp)}`)

  const pathCommitIdSetMap = new Map<string, Set<string>>()
  for (const path of paths) {
    // Do not use `git log base..head -- path`, because it returns unrelated commits.
    const headCommitIdSetForPath = await git.getCommitIdSetForPath({
      cwd: workspace,
      head: inputs.head,
      since: oldestCommitTimestamp,
      path,
    })
    const baseHeadCommitIdSetForPath = baseHeadCommitIdSet.intersection(headCommitIdSetForPath)
    core.info(`${path}: ${baseHeadCommitIdSetForPath.size} commits`)
    pathCommitIdSetMap.set(path, baseHeadCommitIdSetForPath)
  }
  return pathCommitIdSetMap
}

const fetchCommitsBetweenBaseHead = async (context: Context, cwd: string, base: string, head: string) => {
  await git.fetch(cwd, context, [
    // Do not fetch blobs. Trees are required for path-limited git log.
    '--filter=blob:none',
    base,
    head,
  ])
}

const formatTimestamp = (ts: number) => new Date(ts * 1000).toISOString()
