import { GetCommitHistoryQuery } from '../src/generated/graphql'
import { Commit, computeGroupsAndOthers, parseGetCommitHistoryQuery } from '../src/history'

/*
Commits of pull request #98.
You can get this from https://docs.github.com/en/graphql/overview/explorer with:

{
  "owner": "int128",
  "name": "list-associated-pull-requests-action",
  "path": ".",
  "expression": "test-fixture-head",
  "since": "2022-05-13T22:33:57Z"
}
*/
const fixtureQuery: GetCommitHistoryQuery = {
  rateLimit: {
    cost: 1,
  },
  repository: {
    object: {
      __typename: 'Commit',
      history: {
        totalCount: 27,
        pageInfo: {
          hasNextPage: false,
          endCursor: undefined,
        },
        nodes: [
          {
            oid: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
            associatedPullRequests: {
              nodes: [
                {
                  number: 97,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'f2ac78bee33a1a55186732a1f2fb6b7d68008a53',
            associatedPullRequests: {
              nodes: [
                {
                  number: 90,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'dcff886579270638a2146cf8ba5380f2240774c7',
            associatedPullRequests: {
              nodes: [
                {
                  number: 96,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '4e216f67567bdbb723ad28b1d946c63b6cb09a8d',
            associatedPullRequests: {
              nodes: [
                {
                  number: 91,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'aba1fb9e861f34176727a527a6e5af8ba74f628c',
            associatedPullRequests: {
              nodes: [
                {
                  number: 89,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'ca85088adb0f411ef934833e2b4c47941794ac58',
            associatedPullRequests: {
              nodes: [
                {
                  number: 88,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'ebb87b274ad05f7e5d9a38c677f2e399041dae01',
            associatedPullRequests: {
              nodes: [
                {
                  number: 87,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'fc7d55b8f3e86b9f2b71c30d9e8578dffc40c807',
            associatedPullRequests: {
              nodes: [
                {
                  number: 86,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '8e07a09848e1158d3326ec2ab9006077c087bd33',
            associatedPullRequests: {
              nodes: [
                {
                  number: 85,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'aed841c2c1550f2e2bac160837085856b6cc5120',
            associatedPullRequests: {
              nodes: [
                {
                  number: 84,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '13868898d92652c27d889259bd11215f7a4551c1',
            associatedPullRequests: {
              nodes: [
                {
                  number: 83,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'd486e046fca314b3a42693a5ca878e47c69a89ed',
            associatedPullRequests: {
              nodes: [
                {
                  number: 82,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '6df54289158cbd5a61c8604cf97b8a0f7d1847f7',
            associatedPullRequests: {
              nodes: [
                {
                  number: 81,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '49a339c426a28b6e5abd3203fadcc749560b2362',
            associatedPullRequests: {
              nodes: [
                {
                  number: 80,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'd5414767c25010a8d42f44121dba0ee870c1da53',
            associatedPullRequests: {
              nodes: [
                {
                  number: 79,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'e1d47057c2a2eafd8ebb570c8f7a4a84dffb234e',
            associatedPullRequests: {
              nodes: [
                {
                  number: 78,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '15a4eb0b903195d92d089454ab9ffa1c7598d3ef',
            associatedPullRequests: {
              nodes: [
                {
                  number: 77,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '797d211a801b403772b703ed29e60dc148d708b8',
            associatedPullRequests: {
              nodes: [
                {
                  number: 76,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'b256f3b36b635040e4ce150eec4c4d2fdab3495c',
            associatedPullRequests: {
              nodes: [
                {
                  number: 75,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '1a74c41db6587e71a6c97a2a64741d6152a88638',
            associatedPullRequests: {
              nodes: [
                {
                  number: 74,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '6c696b80a95830b40ae8ed882bbb9bbe1972b24c',
            associatedPullRequests: {
              nodes: [
                {
                  number: 73,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: 'ead2316173fbd364d6d241b8c05df4a349c7821f',
            associatedPullRequests: {
              nodes: [
                {
                  number: 70,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '4449d60e7f1ce5fd3d26750c66b5d708cbac1d20',
            associatedPullRequests: {
              nodes: [
                {
                  number: 71,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: 'f656f6812207d5301492cab12f399463e35fbdbb',
            associatedPullRequests: {
              nodes: [
                {
                  number: 69,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '0ad635a9b2be184a6a02253bcdb090dab6e195c9',
            associatedPullRequests: {
              nodes: [
                {
                  number: 68,
                  author: {
                    login: 'int128',
                  },
                },
              ],
            },
          },
          {
            oid: '3d9cb2f7a130e4427676df5f6da9c06cd228d7d7',
            associatedPullRequests: {
              nodes: [
                {
                  number: 67,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
          {
            oid: '639b198eeec3ff282b00e53e936929b72c004817',
            associatedPullRequests: {
              nodes: [
                {
                  number: 64,
                  author: {
                    login: 'renovate',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
}

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
  const commits = parseGetCommitHistoryQuery(fixtureQuery, sinceCommitId, filterCommitIds)
  expect(commits).toMatchSnapshot()
})

describe('computeGroupsAndOthers', () => {
  it('should return as-is if empty is given', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([['.', []]])
    const actual = computeGroupsAndOthers(commitHistoryByPath)
    expect(actual).toStrictEqual({
      groups: new Map<string, Commit[]>(),
      others: [],
    })
  })

  it('should return as-is if only root is given', () => {
    const commitHistoryByPath = new Map<string, Commit[]>([['.', [{ commitId: 'commit-1' }]]])
    const actual = computeGroupsAndOthers(commitHistoryByPath)
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
    const actual = computeGroupsAndOthers(commitHistoryByPath)
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
    const actual = computeGroupsAndOthers(commitHistoryByPath)
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
    const actual = computeGroupsAndOthers(commitHistoryByPath)
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
