import assert from 'assert'
import { run } from '../src/run'

const { INTEGRATION_TEST_GITHUB_TOKEN } = process.env
const describeOnlyIfToken = INTEGRATION_TEST_GITHUB_TOKEN ? describe : describe.skip

describeOnlyIfToken('GitHub integration test', () => {
  it('should generate outputs of pr-491', async () => {
    assert(INTEGRATION_TEST_GITHUB_TOKEN)

    // https://github.com/int128/list-associated-pull-requests-action/pull/491
    const outputs = await run({
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      token: INTEGRATION_TEST_GITHUB_TOKEN,
      pullRequest: 491,
      groupByPaths: ['src', 'tests', '.github'],
      showOthersGroup: true,
    })
    expect(outputs).toMatchSnapshot()
  }, 30000)
})
