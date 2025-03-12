import assert from 'assert'
import { run } from '../src/run.js'
import { describe, expect, it } from 'vitest'
import { Octokit } from '@octokit/action'

// GitHub token is required.
// To run locally:
//   INTEGRATION_TEST_GITHUB_TOKEN="$(gh auth token)" pnpm test run
const { INTEGRATION_TEST_GITHUB_TOKEN } = process.env
const describeOnlyIfToken = INTEGRATION_TEST_GITHUB_TOKEN ? describe : describe.skip

describeOnlyIfToken('GitHub integration test', () => {
  it('should generate outputs of pr-491', async () => {
    assert(INTEGRATION_TEST_GITHUB_TOKEN)

    // https://github.com/int128/list-associated-pull-requests-action/pull/491
    const outputs = await run(
      {
        pullRequest: 491,
        groupByPaths: ['src', 'tests', '.github'],
        showOthersGroup: true,
        maxFetchCommits: undefined,
      },
      new Octokit({ auth: INTEGRATION_TEST_GITHUB_TOKEN, authStrategy: null }),
      {
        repo: {
          owner: 'int128',
          repo: 'list-associated-pull-requests-action',
        },
      },
    )
    expect(outputs).toMatchSnapshot()
  }, 30000)
})
