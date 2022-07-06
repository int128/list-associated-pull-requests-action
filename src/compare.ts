import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

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
  const { data: rateLimitBefore } = await octokit.rest.rateLimit.get()
  core.info(`Remaining core rate limit: ${rateLimitBefore.resources.core.remaining}`)

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
  }

  const { data: rateLimitAfter } = await octokit.rest.rateLimit.get()
  core.info(
    `Remaining core rate limit: ${rateLimitAfter.resources.core.remaining} (used ${
      rateLimitBefore.resources.core.remaining - rateLimitAfter.resources.core.remaining
    })`
  )

  return { commitIds, earliestCommitId, earliestCommitDate }
}
