import * as core from '@actions/core'
import * as git from './git.js'
import type { Context } from './github.js'

type Inputs = {
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

  const workspace = await git.init(context)

  await git.fetch(
    [
      // Fetch only trees which are required for path-limited git log.
      '--filter=blob:none',
      inputs.base,
    ],
    workspace,
    context,
  )
  const baseCommitId = await git.revParse(['FETCH_HEAD'], workspace)
  core.info(`Resolved base commit: ${baseCommitId}`)

  await git.fetch(
    [
      // Fetch only trees which are required for path-limited git log.
      '--filter=blob:none',
      inputs.head,
    ],
    workspace,
    context,
  )
  const headCommitId = await git.revParse(['FETCH_HEAD'], workspace)
  core.info(`Resolved head commit: ${headCommitId}`)

  const baseHeadCommitIdSet = await git.getCommitIdSetBetweenBaseHead({
    cwd: workspace,
    base: baseCommitId,
    head: headCommitId,
  })
  core.info(`Total ${baseHeadCommitIdSet.size} commits between base and head`)
  if (baseHeadCommitIdSet.size === 0) {
    return new Map(paths.map((path) => [path, new Set<string>()]))
  }

  const oldestCommitTimestamp = await git.getOldestCommitTimestampBetweenBaseHead({
    cwd: workspace,
    base: baseCommitId,
    head: headCommitId,
  })
  core.info(`The oldest commit is at ${formatTimestamp(oldestCommitTimestamp)}`)

  const pathCommitIdSetMap = new Map<string, Set<string>>()
  for (const path of paths) {
    // Do not use `git log base..head -- path`, because it returns unrelated commits.
    const headCommitIdSetForPath = await git.getCommitIdSetForPath({
      cwd: workspace,
      head: headCommitId,
      since: oldestCommitTimestamp,
      path,
    })
    const baseHeadCommitIdSetForPath = baseHeadCommitIdSet.intersection(headCommitIdSetForPath)
    core.info(`${path}: ${baseHeadCommitIdSetForPath.size} commits`)
    pathCommitIdSetMap.set(path, baseHeadCommitIdSetForPath)
  }
  return pathCommitIdSetMap
}

const formatTimestamp = (ts: number) => new Date(ts * 1000).toISOString()
