import * as stream from 'node:stream'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { type Context, getToken } from './github.js'

export const init = async (cwd: string) => {
  await exec.exec('git', ['init', '--quiet', '.'], { cwd })
}

type GetCommitsBetweenBaseHead = {
  cwd: string
  base: string
  head: string
}

export const getCommitIdSetBetweenBaseHead = async (input: GetCommitsBetweenBaseHead): Promise<Set<string>> => {
  const commitIdSet = new Set<string>()
  await exec.exec('git', ['log', '--pretty=%H', `${input.base}..${input.head}`], {
    cwd: input.cwd,
    outStream: new stream.PassThrough(), // Suppress output to avoid large logs
    listeners: {
      stdline: (line) => commitIdSet.add(line.trim()),
    },
  })
  return commitIdSet
}

export const getOldestCommitTimestampBetweenBaseHead = async (input: GetCommitsBetweenBaseHead): Promise<number> => {
  let oldest = Number.POSITIVE_INFINITY
  await exec.exec('git', ['log', '--pretty=%ct', `${input.base}..${input.head}`], {
    cwd: input.cwd,
    outStream: new stream.PassThrough(), // Suppress output to avoid large logs
    listeners: {
      stdline: (line) => {
        oldest = Math.min(oldest, Number(line.trim()))
      },
    },
  })
  return oldest
}

type GetCommitIdSetForPath = {
  cwd: string
  head: string
  since: number
  path: string
}

export const getCommitIdSetForPath = async (input: GetCommitIdSetForPath): Promise<Set<string>> => {
  const commitIdSet = new Set<string>()
  await exec.exec('git', ['log', '--pretty=%H', `--since=${input.since}`, input.head, '--', input.path], {
    cwd: input.cwd,
    outStream: new stream.PassThrough(), // Suppress output to avoid large logs
    listeners: {
      stdline: (line) => commitIdSet.add(line.trim()),
    },
  })
  return commitIdSet
}

export const fetch = async (cwd: string, context: Context, args: string[]) =>
  await exec.exec(
    'git',
    [
      ...gitTokenConfigFlags(context),
      'fetch',
      `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}.git`,
      '--quiet',
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
