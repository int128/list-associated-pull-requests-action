import { CommitHistoryOfSubTreeQuery, PullRequestCommitsQuery } from '../src/generated/graphql'
import { calculate } from '../src/pull'

test('calculate', () => {
  // commit of pull request #98
  const commitsQueryList: PullRequestCommitsQuery[] = [
    {
      rateLimit: {
        cost: 1,
      },
      repository: {
        pullRequest: {
          headRefOid: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
          commits: {
            totalCount: 26,
            pageInfo: {
              hasNextPage: false,
              endCursor: 'MjY',
            },
            nodes: [
              {
                commit: {
                  oid: '3d9cb2f7a130e4427676df5f6da9c06cd228d7d7',
                  committedDate: '2022-05-14T01:46:46Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 67,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '0ad635a9b2be184a6a02253bcdb090dab6e195c9',
                  committedDate: '2022-05-14T05:31:47Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 68,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'f656f6812207d5301492cab12f399463e35fbdbb',
                  committedDate: '2022-05-14T07:41:25Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 69,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '4449d60e7f1ce5fd3d26750c66b5d708cbac1d20',
                  committedDate: '2022-05-14T12:42:37Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 71,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'ead2316173fbd364d6d241b8c05df4a349c7821f',
                  committedDate: '2022-05-14T12:45:14Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 70,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '6c696b80a95830b40ae8ed882bbb9bbe1972b24c',
                  committedDate: '2022-05-14T12:52:59Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 73,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '1a74c41db6587e71a6c97a2a64741d6152a88638',
                  committedDate: '2022-05-15T01:04:29Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 74,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'b256f3b36b635040e4ce150eec4c4d2fdab3495c',
                  committedDate: '2022-05-15T07:01:51Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 75,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '797d211a801b403772b703ed29e60dc148d708b8',
                  committedDate: '2022-05-15T07:36:12Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 76,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '15a4eb0b903195d92d089454ab9ffa1c7598d3ef',
                  committedDate: '2022-05-15T08:30:44Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 77,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'e1d47057c2a2eafd8ebb570c8f7a4a84dffb234e',
                  committedDate: '2022-05-15T09:27:30Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 78,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'd5414767c25010a8d42f44121dba0ee870c1da53',
                  committedDate: '2022-05-16T20:30:24Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 79,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '49a339c426a28b6e5abd3203fadcc749560b2362',
                  committedDate: '2022-05-17T03:39:16Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 80,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '6df54289158cbd5a61c8604cf97b8a0f7d1847f7',
                  committedDate: '2022-05-17T18:43:59Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 81,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'd486e046fca314b3a42693a5ca878e47c69a89ed',
                  committedDate: '2022-05-21T03:07:41Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 82,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '13868898d92652c27d889259bd11215f7a4551c1',
                  committedDate: '2022-05-23T21:43:39Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 83,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'aed841c2c1550f2e2bac160837085856b6cc5120',
                  committedDate: '2022-05-24T11:59:55Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 84,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '8e07a09848e1158d3326ec2ab9006077c087bd33',
                  committedDate: '2022-05-24T22:39:38Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 85,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'fc7d55b8f3e86b9f2b71c30d9e8578dffc40c807',
                  committedDate: '2022-05-26T02:26:42Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 86,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'ebb87b274ad05f7e5d9a38c677f2e399041dae01',
                  committedDate: '2022-05-26T09:52:50Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 87,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'ca85088adb0f411ef934833e2b4c47941794ac58',
                  committedDate: '2022-05-27T00:20:11Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 88,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'aba1fb9e861f34176727a527a6e5af8ba74f628c',
                  committedDate: '2022-05-27T00:29:05Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 89,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '4e216f67567bdbb723ad28b1d946c63b6cb09a8d',
                  committedDate: '2022-05-28T05:09:40Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 91,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'dcff886579270638a2146cf8ba5380f2240774c7',
                  committedDate: '2022-05-28T12:28:25Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 96,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: 'f2ac78bee33a1a55186732a1f2fb6b7d68008a53',
                  committedDate: '2022-05-28T14:34:18Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 90,
                      },
                    ],
                  },
                },
              },
              {
                commit: {
                  oid: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
                  committedDate: '2022-05-28T23:41:47Z',
                  associatedPullRequests: {
                    nodes: [
                      {
                        number: 97,
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    },
  ]
  const historyQueryList: { path: string; q: CommitHistoryOfSubTreeQuery }[] = [
    {
      path: 'src',
      q: {
        rateLimit: {
          cost: 1,
        },
        repository: {
          object: {
            __typename: 'Commit',
            history: {
              nodes: [
                {
                  oid: 'aba1fb9e861f34176727a527a6e5af8ba74f628c',
                },
                {
                  oid: 'ca85088adb0f411ef934833e2b4c47941794ac58',
                },
                {
                  oid: 'ebb87b274ad05f7e5d9a38c677f2e399041dae01',
                },
                {
                  oid: 'e1d47057c2a2eafd8ebb570c8f7a4a84dffb234e',
                },
                {
                  oid: '797d211a801b403772b703ed29e60dc148d708b8',
                },
                {
                  oid: 'b256f3b36b635040e4ce150eec4c4d2fdab3495c',
                },
                {
                  oid: 'ead2316173fbd364d6d241b8c05df4a349c7821f',
                },
                {
                  oid: 'f656f6812207d5301492cab12f399463e35fbdbb',
                },
                {
                  oid: '0ad635a9b2be184a6a02253bcdb090dab6e195c9',
                },
              ],
            },
          },
        },
      },
    },
    {
      path: '.github',
      q: {
        rateLimit: {
          cost: 1,
        },
        repository: {
          object: {
            __typename: 'Commit',
            history: {
              nodes: [
                {
                  oid: 'dcff886579270638a2146cf8ba5380f2240774c7',
                },
                {
                  oid: '4e216f67567bdbb723ad28b1d946c63b6cb09a8d',
                },
                {
                  oid: 'ebb87b274ad05f7e5d9a38c677f2e399041dae01',
                },
                {
                  oid: 'e1d47057c2a2eafd8ebb570c8f7a4a84dffb234e',
                },
                {
                  oid: 'ead2316173fbd364d6d241b8c05df4a349c7821f',
                },
              ],
            },
          },
        },
      },
    },
  ]
  const { commitPullsOfPaths, commitPullsOfOthers, associatedPullRequests } = calculate(
    commitsQueryList,
    historyQueryList
  )
  expect(associatedPullRequests).toMatchSnapshot()
  expect(commitPullsOfPaths).toMatchSnapshot()
  expect(commitPullsOfOthers).toMatchSnapshot()
})
