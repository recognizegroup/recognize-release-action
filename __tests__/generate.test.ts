import {it, expect, describe, jest} from '@jest/globals'
import {Context} from '@actions/github/lib/context'
import {Octokit} from '@octokit/rest'
import {mocked} from 'jest-mock'
import {annotateCommit} from '../src/commit-annotator'
import {findPreviousDeploymentForEnvironment} from '../src/deployments'
import {compareCommits} from '../src/compare-commits'
import {generateDeploymentReport} from '../src/generate'
import {Deployment} from '@octokit/webhooks-types'
import {generateMarkdownReport} from '../src/markdown-reporter'
import {GitHub} from '@actions/github/lib/utils'

jest.mock('../src/deployments')
jest.mock('../src/commit-annotator')
jest.mock('../src/compare-commits')
jest.mock('../src/markdown-reporter')
jest.mock('@actions/core')
jest.mock('@octokit/rest')

const octokit = new Octokit()
const mockedOctokit = mocked(octokit) as unknown as InstanceType<typeof GitHub>

describe('generate', () => {
  it('should not continue if there is no previous deployment', async () => {
    const mockedPreviousDeployment = mocked(
      findPreviousDeploymentForEnvironment
    )
    const mockedCompareCommits = mocked(compareCommits)
    mockedPreviousDeployment.mockReturnValueOnce(Promise.resolve(undefined))

    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context
    const deployment = {id: 1, environment: 'Test'} as unknown as Deployment

    await generateDeploymentReport(mockedOctokit, context, deployment)

    expect(mockedCompareCommits).not.toBeCalled()
  })

  it('should perform a full reports', async () => {
    const mockedPreviousDeployment = mocked(
      findPreviousDeploymentForEnvironment
    )
    const mockedCompareCommits = mocked(compareCommits)
    const mockedGenerateMarkdownReport = mocked(generateMarkdownReport)
    const mockedAnnotateCommit = mocked(annotateCommit)

    mockedPreviousDeployment.mockReturnValueOnce(
      Promise.resolve({id: 1, sha: '1'} as any)
    )
    mockedCompareCommits.mockReturnValueOnce(
      Promise.resolve([{commit: {message: 'TD-1 - Changes '}}])
    )

    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context
    const deployment = {id: 2, environment: 'Test'} as unknown as Deployment

    await generateDeploymentReport(mockedOctokit, context, deployment)

    expect(mockedCompareCommits).toBeCalled()
    expect(mockedGenerateMarkdownReport).toBeCalled()
    expect(mockedAnnotateCommit).toBeCalled()
  })
})
