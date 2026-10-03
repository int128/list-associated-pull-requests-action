import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { type Context, getToken } from './github.js'

export const init = async (cwd: string) => {
  await exec.exec('git', ['init', '--quiet', '.'], { cwd })
}

type GetCommitsInput = {
  cwd: string
  base: string
  head: string
}

export const getCommits = async (input: GetCommitsInput): Promise<string[]> => {
  const output = await exec.getExecOutput('git', ['log', '--pretty=format:%H', `${input.base}...${input.head}`], {
    cwd: input.cwd,
  })
  return output.stdout.trim().split('\n')
}

export const getCommitDate = async (cwd: string, id: string): Promise<Date> => {
  const output = await exec.getExecOutput('git', ['log', '-1', '--pretty=format:%cI', id], { cwd })
  return new Date(output.stdout.trim())
}

type CanMergeInput = {
  cwd: string
  base: string
  head: string
}

export const canMerge = async (input: CanMergeInput): Promise<boolean> =>
  (await exec.exec('git', ['merge-base', input.base, input.head], { cwd: input.cwd, ignoreReturnCode: true })) === 0

type FetchInput = {
  cwd: string
  refs: string[]
  depth: number
}

export const fetch = async (input: FetchInput, context: Context) =>
  await exec.exec(
    'git',
    [
      ...gitTokenConfigFlags(context),
      'fetch',
      `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}.git`,
      '--quiet',
      `--depth=${input.depth}`,
      ...input.refs,
    ],
    {
      cwd: input.cwd,
      env: {
        ...process.env,
        CONFIG_VALUE_AUTHORIZATION_HEADER: authorizationHeader(),
      },
    },
  )

export const gitTokenConfigFlags = (context: Context) => {
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
