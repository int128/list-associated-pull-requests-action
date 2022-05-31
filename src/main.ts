import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  const outputs = await run({
    token: core.getInput('token', { required: true }),
    pullRequest: parseInt(core.getInput('pull-request')),
    base: core.getInput('base'),
    head: core.getInput('head'),
    path: core.getInput('path', { required: true }),
    groupByPaths: core.getMultilineInput('group-by-paths'),
    showOthersGroup: core.getBooleanInput('show-others-group', { required: true }),
  })

  core.setOutput('body', outputs.body)
  core.setOutput('associated-pull-requests', outputs.associatedPullRequests.join('\n'))
}

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
