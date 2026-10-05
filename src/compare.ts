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
  const workspace = await mkdtemp(path.join(context.runnerTemp, `${inputs.owner}-${inputs.repo}-`))
  await git.init(workspace)
  await fetchCommitsBetweenBaseHead(context, workspace, inputs.base, inputs.head)

  const paths = [...inputs.paths]
  if (inputs.includeRoot) {
    paths.push('.')
  }
  const pathCommitIdSetMap = new Map<string, Set<string>>()
  for (const path of paths) {
    const commitIdSet = new Set<string>(
      await git.getCommits({
        cwd: workspace,
        base: inputs.base,
        head: inputs.head,
        path,
      }),
    )
    core.info(`${path}: ${commitIdSet.size} commits`)
    pathCommitIdSetMap.set(path, commitIdSet)
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
