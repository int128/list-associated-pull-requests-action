import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { compareBaseHeadQuery } from './queries/compare'
import { CompareBaseHeadQuery } from './generated/graphql'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  owner: string
  repo: string
  base: string
  head: string
}

export type Commit = {
  commitId: string
  committedDate: Date
  pull?: {
    number: number
    author: string
  }
}

export const compareBaseHead = async (octokit: Octokit, inputs: Inputs): Promise<Commit[]> => {
  const commits: Commit[] = []
  for (let afterCursor: string | undefined; ; ) {
    core.info(`compareBaseHeadQuery()`)
    const q = await compareBaseHeadQuery(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      base: inputs.base,
      head: inputs.head,
      size: 100,
      after: afterCursor,
    })
    const page = parseCompareBaseHeadQuery(q)
    commits.push(...page.commits)
    if (page.hasNextPage === false) {
      break
    }
    afterCursor = page.endCursor
  }
  return commits
}

type Page = {
  commits: Commit[]
  hasNextPage: boolean
  endCursor?: string
}

const parseCompareBaseHeadQuery = (q: CompareBaseHeadQuery): Page => {
  if (q.repository?.ref?.compare?.commits == null) {
    throw new Error(`unexpected response: ${JSON.stringify(q, undefined, 2)}`)
  }
  const commits: Commit[] = []
  for (const commitNode of q.repository?.ref?.compare?.commits.nodes ?? []) {
    if (commitNode === null) {
      continue
    }
    let pull
    if (commitNode.associatedPullRequests?.nodes?.length) {
      const pullNode = commitNode.associatedPullRequests.nodes[0]
      if (pullNode?.number !== undefined) {
        core.info(`${commitNode.oid} -> #${pullNode.number}`)
        pull = {
          number: pullNode.number,
          author: pullNode.author?.login ?? '',
        }
      }
    }
    const committedDate = new Date(commitNode.committedDate)
    commits.push({
      commitId: commitNode.oid,
      committedDate,
      pull,
    })
  }
  return {
    commits,
    hasNextPage: q.repository.ref.compare.commits.pageInfo.hasNextPage,
    endCursor: q.repository.ref.compare.commits.pageInfo.endCursor ?? undefined,
  }
}
