import * as core from '@actions/core'
import * as github from '@actions/github'
import { computeChangeSetBetweenBaseHead } from './basehead'

type Inputs = {
  token: string
  pullRequest: number
  groupByPaths: string[]
  showOthersGroup: boolean
}

type Outputs = {
  body: string
}

export const computeChangeSetOfPullRequest = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  const { data: pull } = await octokit.rest.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: inputs.pullRequest,
  })
  core.info(`pull request ${pull.number}: ${pull.head.ref} -> ${pull.base.ref}`)

  return await computeChangeSetBetweenBaseHead({
    ...inputs,
    base: pull.base.ref,
    head: pull.head.ref,
  })
}
