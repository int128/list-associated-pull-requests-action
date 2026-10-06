import { describe, expect, it } from 'vitest'
import { buildOthers, buildPathPullSet, type CommitPullMap, splitSet } from '../src/pull.js'

describe('splitSet', () => {
  it('splits a set into chunks of the requested size', () => {
    expect(splitSet(new Set([1, 2, 3, 4, 5]).values(), 2)).toEqual([new Set([1, 2]), new Set([3, 4]), new Set([5])])
  })

  it('returns no chunks for an empty set', () => {
    expect(splitSet(new Set().values(), 2)).toEqual([])
  })
})

describe('buildPathPullSet', () => {
  it('maps commits to associated pulls and keeps commits without a pull request', () => {
    const commitPullMap: CommitPullMap = new Map([
      ['commit-with-pull', { number: 42, title: 'Add feature', author: 'octocat' }],
      ['commit-without-pull', null],
    ])

    const result = buildPathPullSet(
      new Map([['src', new Set(['commit-with-pull', 'commit-without-pull', 'missing-from-pull-map'])]]),
      commitPullMap,
    )

    expect([...(result.get('src') ?? [])]).toEqual([
      { number: 42, title: 'Add feature', author: 'octocat' },
      'commit-without-pull',
      'missing-from-pull-map',
    ])
  })
})

describe('buildOthers', () => {
  it('excludes commits found in any non-root path', () => {
    const commitPullMap: CommitPullMap = new Map([
      ['src-commit', { number: 10, title: 'Source change', author: 'octocat' }],
      ['tests-commit', { number: 11, title: 'Test change', author: 'octocat' }],
      ['only-root-commit', { number: 12, title: 'Other change', author: 'octocat' }],
    ])

    const result = buildOthers(
      new Map([
        ['src', new Set(['src-commit'])],
        ['tests', new Set(['tests-commit'])],
        ['.', new Set(['src-commit', 'tests-commit', 'only-root-commit'])],
      ]),
      commitPullMap,
    )

    expect([...result]).toEqual([{ number: 12, title: 'Other change', author: 'octocat' }])
  })

  it('keeps root commits without an associated pull request', () => {
    const result = buildOthers(
      new Map([
        ['src', new Set(['grouped-commit'])],
        ['.', new Set(['grouped-commit', 'unassociated-commit'])],
      ]),
      new Map([['grouped-commit', { number: 1, title: 'Grouped', author: 'octocat' }]]),
    )

    expect([...result]).toEqual(['unassociated-commit'])
  })
})
