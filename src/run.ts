import { computeChangeSetBetweenBaseHead } from './basehead'
import { computeChangeSetOfPullRequest } from './pull'

type Inputs = {
  token: string
  pullRequest: number
  base: string
  head: string
  path: string
  groupBySubPaths: string[]
}

type Outputs = {
  body: string
  associatedPullRequests: number[]
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  inputs.groupBySubPaths = sanitizeSubPaths(inputs.groupBySubPaths)

  if (inputs.pullRequest) {
    return await computeChangeSetOfPullRequest(inputs)
  }
  if (inputs.base && inputs.head) {
    return await computeChangeSetBetweenBaseHead(inputs)
  }
  throw new Error('you need to set either pull-request or base/head')
}

const sanitizeSubPaths = (groupBySubPaths: string[]) =>
  groupBySubPaths.filter((p) => p.length > 0 && !p.startsWith('#'))
