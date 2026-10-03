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
}

export const compareCommits = async (context: Context, inputs: Inputs): Promise<Map<string, Set<string>>> => {
  const workspace = await mkdtemp(path.join(context.runnerTemp, `${inputs.owner}-${inputs.repo}-`))
  await git.init(workspace)
  await fetchCommitsBetweenBaseHead(context, workspace, inputs.base, inputs.head)

  const pathCommitIdsMap = new Map<string, Set<string>>()
  for (const path of inputs.paths) {
    const commitIds = new Set<string>(
      await git.getCommits({
        cwd: workspace,
        base: inputs.base,
        head: inputs.head,
        path,
      }),
    )
    core.info(`${path}: ${commitIds.size} commits`)
    pathCommitIdsMap.set(path, commitIds)
  }
  return pathCommitIdsMap
}

const fetchCommitsBetweenBaseHead = async (context: Context, cwd: string, base: string, head: string) => {
  const FETCH_HARD_LIMIT = 50000
  for (let depth = 1000; depth < FETCH_HARD_LIMIT; depth += 1000) {
    await git.fetch({ cwd, refs: [base, head], depth }, context)
    if (await git.hasMergeBase({ cwd, base, head })) {
      core.info(`Fetched commits between base and head`)
      return
    }
  }
  throw new Error(`too many commits between base and head`)
}
