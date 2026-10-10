import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { type Context, getToken } from './github.js'

export const init = async (context: Context) => {
  const cwd = await fs.mkdtemp(path.join(context.runnerTemp, `${context.repo.owner}-${context.repo.repo}-`))
  await exec.exec('git', ['init', '--quiet', '.'], { cwd })
  return cwd
}

export const revParse = async (args: string[], cwd: string) => {
  const output = await exec.getExecOutput('git', ['rev-parse', '--verify', ...args], { cwd })
  return output.stdout.trim()
}

type GetCommitsBetweenBaseHead = {
  cwd: string
  base: string
  head: string
}

export const getCommitIdSetBetweenBaseHead = async (input: GetCommitsBetweenBaseHead): Promise<Set<string>> => {
  const commitIds = await execGitLog(['--pretty=%H', `${input.base}..${input.head}`], input.cwd)
  return new Set(commitIds)
}

export const getOldestCommitTimestampBetweenBaseHead = async (input: GetCommitsBetweenBaseHead): Promise<number> => {
  const commitTimestamps = await execGitLog(['--pretty=%ct', `${input.base}..${input.head}`], input.cwd)
  return commitTimestamps.reduce((oldest, line) => Math.min(oldest, Number(line)), Number.MAX_VALUE)
}

type GetCommitIdSetForPath = {
  cwd: string
  head: string
  since: number
  path: string
}

export const getCommitIdSetForPath = async (input: GetCommitIdSetForPath): Promise<Set<string>> => {
  const commitIds = await execGitLog(['--pretty=%H', `--since=${input.since}`, input.head, '--', input.path], input.cwd)
  return new Set(commitIds)
}

const execGitLog = async (args: string[], cwd: string): Promise<string[]> => {
  try {
    await exec.exec('git', ['log', `--output=commits`, ...args], { cwd })
    const commits = await fs.readFile(path.join(cwd, 'commits'), 'utf-8')
    return commits.split('\n').filter((line) => line)
  } finally {
    await fs.rm(path.join(cwd, 'commits'), { force: true })
  }
}

export const fetch = async (args: string[], cwd: string, context: Context) =>
  await exec.exec(
    'git',
    [
      ...gitTokenConfigFlags(context),
      'fetch',
      `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}.git`,
      ...args,
    ],
    {
      cwd,
      env: {
        ...process.env,
        CONFIG_VALUE_AUTHORIZATION_HEADER: authorizationHeader(),
      },
    },
  )

const gitTokenConfigFlags = (context: Context) => {
  const origin = new URL(context.serverUrl).origin
  return [
    // Reset http.extraheader config set by actions/checkout
    // https://github.com/actions/checkout/issues/162#issuecomment-590821598
    `-c`,
    `http.${origin}/.extraheader=`,
    `--config-env=http.${origin}/.extraheader=CONFIG_VALUE_AUTHORIZATION_HEADER`,
  ]
}

const authorizationHeader = () => {
  const credentials = Buffer.from(`x-access-token:${getToken()}`).toString('base64')
  core.setSecret(credentials)
  return `AUTHORIZATION: basic ${credentials}`
}
