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

  for (let depth = 1000; depth < 10000; depth += 1000) {
    await git.fetch({ cwd: workspace, refs: [inputs.base, inputs.head], depth }, context)
    if (await git.canMerge({ cwd: workspace, base: inputs.base, head: inputs.head })) {
      core.info(`Fetched commits required to merge base and head`)
      break
    }
  }

  const commits = await git.getCommits({ cwd: workspace, base: inputs.base, head: inputs.head })
  const commitIds = new Set<string>(commits)
  core.info(`Compare: total ${commitIds.size} commits`)

  const earliestCommitId = commits[commits.length - 1]
  const earliestCommitDate = await git.getCommitDate(workspace, earliestCommitId)

  return { commitIds, earliestCommitId, earliestCommitDate }
}
