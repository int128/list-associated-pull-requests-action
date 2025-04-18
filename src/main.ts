import * as core from '@actions/core'
import { run } from './run.js'
import { getContext, getOctokit } from './github.js'

const main = async (): Promise<void> => {
  const outputs = await run(
    {
      pullRequest: parseInt(core.getInput('pull-request')) || undefined,
      base: core.getInput('base') || undefined,
      head: core.getInput('head') || undefined,
      groupByPaths: core.getMultilineInput('group-by-paths'),
      showOthersGroup: core.getBooleanInput('show-others-group', { required: true }),
      maxFetchCommits: Number.parseInt(core.getInput('max-fetch-commits')) || undefined,
    },
    getOctokit(),
    getContext(),
  )

  core.setOutput('body', outputs.body)
  core.setOutput('body-groups', outputs.bodyGroups)
  core.setOutput('body-others', outputs.bodyOthers)
  core.setOutput('json', outputs.json)

  core.startGroup('outputs.bodyGroups')
  core.info(outputs.bodyGroups)
  core.endGroup()
  core.startGroup('outputs.bodyOthers')
  core.info(outputs.bodyOthers)
  core.endGroup()
  core.startGroup('outputs.json')
  core.info(JSON.stringify(outputs.json, null, 2))
  core.endGroup()
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
