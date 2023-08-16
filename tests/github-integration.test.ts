import assert from 'assert'
import { run } from '../src/run'

const { INTEGRATION_TEST_GITHUB_TOKEN } = process.env
const describeIfGitHubToken = INTEGRATION_TEST_GITHUB_TOKEN ? describe : describe.skip

describeIfGitHubToken('GitHub integration tests', () => {
  // https://github.com/int128/list-associated-pull-requests-action/pull/98
  it('should generate outputs of pr-98', async () => {
    assert(INTEGRATION_TEST_GITHUB_TOKEN)
    const outputs = await run({
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      token: INTEGRATION_TEST_GITHUB_TOKEN,
      pullRequest: 98,
      groupByPaths: ['src', 'tests', '.github'],
      showOthersGroup: true,
    })
    expect(outputs).toMatchSnapshot()
  })

  // https://github.com/int128/list-associated-pull-requests-action/pull/491
  it('should generate outputs of pr-491', async () => {
    assert(INTEGRATION_TEST_GITHUB_TOKEN)
    const outputs = await run({
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      token: INTEGRATION_TEST_GITHUB_TOKEN,
      pullRequest: 491,
      groupByPaths: ['src', 'tests', '.github'],
      showOthersGroup: true,
    })
    expect(outputs).toMatchSnapshot()
  }, 30000) // pr-491 contains many commits
})
