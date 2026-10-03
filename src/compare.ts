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
}

type Outputs = {
  commitIds: Set<string>
  earliestCommitId: string
  earliestCommitDate: Date
}

export const compareCommits = async (context: Context, inputs: Inputs): Promise<Outputs> => {
  const workspace = await mkdtemp(path.join(context.runnerTemp, `${inputs.owner}-${inputs.repo}-`))
  await git.init(workspace)
  await fetchCommitsBetweenBaseHead(context, workspace, inputs.base, inputs.head)

  const commits = await git.getCommits({ cwd: workspace, base: inputs.base, head: inputs.head })
  core.info(`Total ${commits.length} commits between base and head`)
  if (commits.length === 0) {
    throw new Error(`no commit between base and head`)
  }

  const earliestCommitId = commits[commits.length - 1]
  return {
    commitIds: new Set<string>(commits),
    earliestCommitId,
    earliestCommitDate: await git.getCommitDate(workspace, earliestCommitId),
  }
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
