import * as core from '@actions/core'
import { Octokit } from '@octokit/action'

type Inputs = {
  owner: string
  repo: string
  base: string
  head: string
}

type Outputs = {
  commitIds: Set<string>
  earliestCommitId: string
  earliestCommitDate: Date
}

export const compareCommits = async (octokit: Octokit, inputs: Inputs): Promise<Outputs> => {
  core.info(`Comparing base ${inputs.base} and head ${inputs.head}`)
  const compareIterator = octokit.paginate.iterator(octokit.rest.repos.compareCommitsWithBasehead, {
    owner: inputs.owner,
    repo: inputs.repo,
    basehead: `${inputs.base}...${inputs.head}`,
    per_page: 100,
  })

  const commitIds = new Set<string>()
  let earliestCommitDate = new Date()
  let earliestCommitId = ''
  for await (const compare of compareIterator) {
    for (const commit of compare.data.commits) {
      commitIds.add(commit.sha)
      if (commit.commit.committer?.date) {
        const d = new Date(commit.commit.committer.date)
        if (d < earliestCommitDate) {
          earliestCommitDate = d
          earliestCommitId = commit.sha
        }
      }
    }
    core.info(
      `Received ${commitIds.size} / ${compare.data.total_commits} commits (ratelimit-remaining: ${compare.headers['x-ratelimit-remaining']})`,
    )
  }
  return { commitIds, earliestCommitId, earliestCommitDate }
}
