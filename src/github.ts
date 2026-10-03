import assert from 'node:assert'
import { Octokit } from '@octokit/action'
import { retry } from '@octokit/plugin-retry'

export const getOctokit = () => new (Octokit.plugin(retry))()

export type Context = {
  repo: {
    owner: string
    repo: string
  }
  serverUrl: string
  runnerTemp: string
}

export const getContext = (): Context => {
  // https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
  return {
    repo: getRepo(),
    serverUrl: getEnv('GITHUB_SERVER_URL'),
    runnerTemp: getEnv('RUNNER_TEMP'),
  }
}

const getRepo = () => {
  const [owner, repo] = getEnv('GITHUB_REPOSITORY').split('/')
  return { owner, repo }
}

const getEnv = (name: string): string => {
  assert(process.env[name], `${name} is required`)
  return process.env[name]
}
