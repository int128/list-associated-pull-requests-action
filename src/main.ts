import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  const outputs = await run({
    token: core.getInput('token', { required: true }),
    pullRequest: parseInt(core.getInput('pull-request')) || undefined,
    base: core.getInput('base') || undefined,
    head: core.getInput('head') || undefined,
    groupByPaths: core.getMultilineInput('group-by-paths'),
    showOthersGroup: core.getBooleanInput('show-others-group', { required: true }),
  })

  core.setOutput('body', outputs.body)
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
