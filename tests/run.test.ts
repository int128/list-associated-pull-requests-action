import { describe, expect, it } from 'vitest'
import { determineSinceCommitDate } from '../src/run.js'

describe('determineSinceCommitDate', () => {
  it('returns the earliestCommitDate if maxFetchDays is not set', () => {
    const earliestCommitDate = new Date('2022-01-01T00:00:00Z')
    const result = determineSinceCommitDate(earliestCommitDate, undefined)
    expect(result).toEqual(earliestCommitDate)
  })

  it('returns the date limited by maxFetchDays if it is set', () => {
    const earliestCommitDate = new Date('2022-01-01T00:00:00Z')
    const now = new Date('2022-01-10T00:00:00Z')
    const result = determineSinceCommitDate(earliestCommitDate, 5, now)
    expect(result).toEqual(new Date('2022-01-05T00:00:00Z'))
  })

  it('returns the earliestCommitDate if it is more recent than the date limited by maxFetchDays', () => {
    const earliestCommitDate = new Date('2022-01-07T00:00:00Z')
    const now = new Date('2022-01-10T00:00:00Z')
    const result = determineSinceCommitDate(earliestCommitDate, 5, now)
    expect(result).toEqual(earliestCommitDate)
  })
})
