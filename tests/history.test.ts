import { describe, expect, it, test } from 'vitest'
import {
  type Commit,
  dedupeCommitsByPullRequest,
  extractOthersFromCommitHistoryGroups,
  parseGetCommitHistoryQuery,
} from '../src/history.js'
import { fixtureResponse } from './queries/getCommitHistory.fixture.js'

test('parseGetCommitHistoryQuery', () => {
  const filterCommitIds = new Set<string>([
    '0f9bbfade221f8b590163c664e27c3839fffd3c8',
    'f2ac78bee33a1a55186732a1f2fb6b7d68008a53',
    'dcff886579270638a2146cf8ba5380f2240774c7',
    '4e216f67567bdbb723ad28b1d946c63b6cb09a8d',
    'aba1fb9e861f34176727a527a6e5af8ba74f628c',
    'ca85088adb0f411ef934833e2b4c47941794ac58',
    'ebb87b274ad05f7e5d9a38c677f2e399041dae01',
    'fc7d55b8f3e86b9f2b71c30d9e8578dffc40c807',
    '8e07a09848e1158d3326ec2ab9006077c087bd33',
    'aed841c2c1550f2e2bac160837085856b6cc5120',
    '13868898d92652c27d889259bd11215f7a4551c1',
    'd486e046fca314b3a42693a5ca878e47c69a89ed',
    '6df54289158cbd5a61c8604cf97b8a0f7d1847f7',
    '49a339c426a28b6e5abd3203fadcc749560b2362',
    'd5414767c25010a8d42f44121dba0ee870c1da53',
    'e1d47057c2a2eafd8ebb570c8f7a4a84dffb234e',
    '15a4eb0b903195d92d089454ab9ffa1c7598d3ef',
    '797d211a801b403772b703ed29e60dc148d708b8',
    'b256f3b36b635040e4ce150eec4c4d2fdab3495c',
    '1a74c41db6587e71a6c97a2a64741d6152a88638',
    '6c696b80a95830b40ae8ed882bbb9bbe1972b24c',
    'ead2316173fbd364d6d241b8c05df4a349c7821f',
    '4449d60e7f1ce5fd3d26750c66b5d708cbac1d20',
    'f656f6812207d5301492cab12f399463e35fbdbb',
    '0ad635a9b2be184a6a02253bcdb090dab6e195c9',
    '3d9cb2f7a130e4427676df5f6da9c06cd228d7d7',
    '639b198eeec3ff282b00e53e936929b72c004817',
  ])
  const sinceCommitId = '3d9cb2f7a130e4427676df5f6da9c06cd228d7d7'
  const commits = parseGetCommitHistoryQuery(fixtureResponse.data, sinceCommitId, filterCommitIds)
  expect(commits).toMatchSnapshot()
})

describe('extractOthersFromCommitHistoryGroups', () => {
  it('should return as-is if empty is given', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([['.', []]])
    const actual = extractOthersFromCommitHistoryGroups(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>(),
      others: [],
    })
  })

  it('should return as-is if only root is given', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([['.', [{ commitId: 'commit-1' }]]])
    const actual = extractOthersFromCommitHistoryGroups(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>(),
      others: [{ commitId: 'commit-1' }],
    })
  })

  it('should return as-is if root is empty', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([
      ['.', []],
      ['foo', [{ commitId: 'commit-2' }]],
      ['bar', [{ commitId: 'commit-3' }]],
    ])
    const actual = extractOthersFromCommitHistoryGroups(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>([
        ['foo', [{ commitId: 'commit-2' }]],
        ['bar', [{ commitId: 'commit-3' }]],
      ]),
      others: [],
    })
  })

  it('should return as-is if root and groups are independent', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([
      ['.', [{ commitId: 'commit-1' }]],
      ['foo', [{ commitId: 'commit-2' }]],
      ['bar', [{ commitId: 'commit-3' }]],
    ])
    const actual = extractOthersFromCommitHistoryGroups(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>([
        ['foo', [{ commitId: 'commit-2' }]],
        ['bar', [{ commitId: 'commit-3' }]],
      ]),
      others: [{ commitId: 'commit-1' }],
    })
  })

  it('should exclude commits of groups from root', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([
      ['.', [{ commitId: 'commit-1' }, { commitId: 'commit-2' }, { commitId: 'commit-3' }, { commitId: 'commit-4' }]],
      ['foo', [{ commitId: 'commit-2' }]],
      ['bar', [{ commitId: 'commit-3' }]],
      ['baz', [{ commitId: 'commit-2' }]],
    ])
    const actual = extractOthersFromCommitHistoryGroups(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>([
        ['foo', [{ commitId: 'commit-2' }]],
        ['bar', [{ commitId: 'commit-3' }]],
        ['baz', [{ commitId: 'commit-2' }]],
      ]),
      others: [{ commitId: 'commit-1' }, { commitId: 'commit-4' }],
    })
  })
})

describe('dedupeCommitsByPullRequest', () => {
  it('should dedupe commits by pull request', () => {
    const commits: Commit[] = [
      { commitId: 'commit-1', pull: { number: 1, author: 'x', title: 'y' } },
      { commitId: 'commit-2' },
      { commitId: 'commit-3', pull: { number: 1, author: 'x', title: 'y' } },
      { commitId: 'commit-4', pull: { number: 2, author: 'x', title: 'y' } },
      { commitId: 'commit-5' },
      { commitId: 'commit-6', pull: { number: 3, author: 'x', title: 'y' } },
      { commitId: 'commit-7', pull: { number: 3, author: 'x', title: 'y' } },
    ]
    const actual = dedupeCommitsByPullRequest(commits)
    expect(actual).toStrictEqual([
      { commitId: 'commit-1', pull: { number: 1, author: 'x', title: 'y' } },
      { commitId: 'commit-2' },
      { commitId: 'commit-4', pull: { number: 2, author: 'x', title: 'y' } },
      { commitId: 'commit-5' },
      { commitId: 'commit-6', pull: { number: 3, author: 'x', title: 'y' } },
    ])
  })
})
