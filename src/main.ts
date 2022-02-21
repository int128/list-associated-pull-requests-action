import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  const outputs = await run({
    token: core.getInput('token', { required: true }),
    base: core.getInput('base', { required: true }),
    head: core.getInput('head', { required: true }),
    path: core.getInput('path', { required: true }),
  })
  core.setOutput('pull-request-list', outputs.pullRequestList)
  core.setOutput('pull-request-list-markdown', outputs.pullRequestListMarkdown)
}

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
