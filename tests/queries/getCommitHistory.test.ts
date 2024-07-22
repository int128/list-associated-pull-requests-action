import { GetCommitHistoryQuery, GetCommitHistoryQueryVariables } from '../../src/generated/graphql.js'
import { paginate } from '../../src/queries/getCommitHistory.js'

describe('paginate', () => {
  const variables: GetCommitHistoryQueryVariables = {
    owner: 'int128',
    name: 'list-associated-pull-requests-action',
    expression: 'branch',
    path: '.',
    since: new Date(),
    historySize: 100,
  }

  test('empty', async () => {
    const mockFn = jest.fn<Promise<GetCommitHistoryQuery>, [GetCommitHistoryQueryVariables]>()
    mockFn.mockResolvedValueOnce({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 0,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [],
          },
        },
      },
    })
    const query = await paginate(mockFn, variables, { maxFetchCommits: undefined })
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(query).toStrictEqual({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 0,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [],
          },
        },
      },
    })
  })

  test('single page', async () => {
    const mockFn = jest.fn<Promise<GetCommitHistoryQuery>, [GetCommitHistoryQueryVariables]>()
    mockFn.mockResolvedValueOnce({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [{ oid: 'commit-1' }],
          },
        },
      },
    })
    const query = await paginate(mockFn, variables, { maxFetchCommits: undefined })
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(query).toStrictEqual({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [{ oid: 'commit-1' }],
          },
        },
      },
    })
  })

  test('multiple pages', async () => {
    const mockFn = jest.fn<Promise<GetCommitHistoryQuery>, [GetCommitHistoryQueryVariables]>()
    mockFn.mockResolvedValueOnce({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor-1',
            },
            nodes: [{ oid: 'commit-1' }],
          },
        },
      },
    })
    mockFn.mockResolvedValueOnce({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor-2',
            },
            nodes: [{ oid: 'commit-2' }],
          },
        },
      },
    })
    mockFn.mockResolvedValueOnce({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [{ oid: 'commit-3' }],
          },
        },
      },
    })
    const query = await paginate(mockFn, variables, { maxFetchCommits: undefined })
    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(query).toStrictEqual({
      repository: {
        object: {
          __typename: 'Commit',
          history: {
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
            },
            nodes: [{ oid: 'commit-1' }, { oid: 'commit-2' }, { oid: 'commit-3' }],
          },
        },
      },
    })
  })
})
