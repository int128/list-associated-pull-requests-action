import assert from 'node:assert'
import { Octokit } from '@octokit/action'
import { describe, expect, it } from 'vitest'
import { run } from '../src/run.js'

// GitHub token is required.
// To run locally:
//   INTEGRATION_TEST_GITHUB_TOKEN="$(gh auth token)" pnpm test run
describe.runIf(process.env.INTEGRATION_TEST_GITHUB_TOKEN)('GitHub integration test', () => {
  it('generates outputs of pr-491', async () => {
    assert(process.env.INTEGRATION_TEST_GITHUB_TOKEN)

    // https://github.com/int128/list-associated-pull-requests-action/pull/491
    const outputs = await run(
      {
        pullRequest: 491,
        groupByPaths: ['src', 'tests', '.github'],
        showOthersGroup: true,
        maxFetchCommits: undefined,
        maxFetchDays: undefined,
      },
      new Octokit({ auth: process.env.INTEGRATION_TEST_GITHUB_TOKEN, authStrategy: null }),
      {
        repo: {
          owner: 'int128',
          repo: 'list-associated-pull-requests-action',
        },
      },
    )
    expect({
      body: outputs.body,
    }).toMatchSnapshot()
  }, 60000)
})
