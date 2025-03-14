import { GetCommitHistoryQuery } from '../../src/generated/graphql.js'

/*
Commits of pull request #98.
You can get a response from https://docs.github.com/en/graphql/overview/explorer with the below variables:

{
  "owner": "int128",
  "name": "list-associated-pull-requests-action",
  "path": ".",
  "expression": "test-fixture-head",
  "since": "2022-05-13T22:33:57Z",
  "historySize": 100
}

*/
export const fixtureResponse: { data: GetCommitHistoryQuery } = {
  data: {
    rateLimit: {
      cost: 1,
      remaining: 4998,
    },
    repository: {
      object: {
        __typename: 'Commit',
        history: {
          totalCount: 27,
          pageInfo: {
            hasNextPage: false,
            endCursor: '0f9bbfade221f8b590163c664e27c3839fffd3c8 26',
          },
          nodes: [
            {
              oid: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
              associatedPullRequests: {
                nodes: [
                  {
                    number: 97,
                    title: 'chore(deps): update dependency eslint-plugin-jest to v26.4.2',
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
                    title: 'chore(deps): update dependency eslint-plugin-jest to v26.3.0',
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
                    title: 'Use test fixture pull request',
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
                    title: 'Rename to list-associated-pull-requests-action',
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
                    title: 'refactor: split basehead.ts',
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
                    title: 'Remove deprecated outputs',
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
                    title: 'Add pull-request parameter',
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
                    title: 'Update dependency @vercel/ncc to v0.34.0',
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
                    title: 'Update dependency typescript to v4.7.2',
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
                    title: 'Update dependency ts-jest to v28.0.3',
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
                    title: 'Update eslint to v5.26.0',
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
                    title: 'Update dependency eslint to v8.16.0',
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
                    title: 'Update eslint to v5.25.0',
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
                    title: 'Update dependency @types/node to v16.11.36',
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
                    title: 'Update eslint to v5.24.0',
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
                    title: 'Sanitize group-by-sub-paths',
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
                    title: 'Refactor doc',
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
                    title: 'Show section only if pull exists in group',
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
                    title: 'refactor: rename to ChangeSet',
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
                    title: 'Update dependency eslint-plugin-jest to v26.2.2',
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
                    title: 'Update README.md',
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
                    title: 'Group pull requests by sub paths',
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
                    title: 'Update dependency eslint-plugin-jest to v26.2.1',
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
                    title: 'refactor: return pulls in findAssociation()',
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
                    title: 'refactor: extract getPullRequestHistoryOfSubTree()',
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
                    title: 'Update dependency eslint-plugin-jest to v26.2.0',
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
                    title: 'Update dependency @actions/github to v5.0.3',
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
  },
}
