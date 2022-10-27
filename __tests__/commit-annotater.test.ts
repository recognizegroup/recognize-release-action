import {it, expect, describe, jest} from '@jest/globals'
import {Context} from '@actions/github/lib/context'
import {Octokit} from '@octokit/rest'
import {mocked} from 'jest-mock'
import {annotateCommit} from '../src/commit-annotator'
import {GitHub} from '@actions/github/lib/utils'

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(() => ({
      rest: {
        checks: {
          create: jest.fn()
        }
      }
    }))
  }
})

const octokit = new Octokit()
const mockedOctokit = mocked(octokit) as unknown as InstanceType<typeof GitHub>

describe('commit annotators', () => {
  it('should upload a report as a check', async () => {
    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context

    const report = '## Commits'

    await annotateCommit(mockedOctokit, context, 'Production', report)
    expect(mockedOctokit.rest.checks.create).toBeCalledWith(
      expect.objectContaining({
        head_sha: context.sha,
        name: 'Deployment report to Production',
        status: 'completed',
        conclusion: 'neutral',
        output: {
          title: 'Deployment report to Production',
          summary: report
        },
        ...context.repo
      })
    )
  })
})
