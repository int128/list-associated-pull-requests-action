import { describe, expect, it } from 'vitest'
import { type Commit, dedupeCommitsByPullRequest, extractOthersFromCommitHistoryGroups } from '../src/history.js'

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
