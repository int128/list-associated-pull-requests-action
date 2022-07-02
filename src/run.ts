import { computeChangeSetBetweenBaseHead } from './basehead'
import { computeChangeSetOfPullRequest } from './pull'

type Inputs = {
  token: string
  pullRequest: number
  base: string
  head: string
  groupByPaths: string[]
  showOthersGroup: boolean
}

type Outputs = {
  body: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  inputs.groupByPaths = sanitizePaths(inputs.groupByPaths)

  if (inputs.pullRequest) {
    return await computeChangeSetOfPullRequest(inputs)
  }
  if (inputs.base && inputs.head) {
    return await computeChangeSetBetweenBaseHead(inputs)
  }
  throw new Error('you need to set either pull-request or base/head')
}

const sanitizePaths = (groupByPaths: string[]) => groupByPaths.filter((p) => p.length > 0 && !p.startsWith('#'))
