import {it, expect, describe, jest} from '@jest/globals'
import {findPreviousDeploymentForEnvironment} from '../src/deployments'
import {Context} from '@actions/github/lib/context'
import {Octokit} from '@octokit/rest'
import {mocked} from 'jest-mock'

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(() => ({
      rest: {
        repos: {
          listDeployments: jest.fn()
        }
      }
    }))
  }
})

const octokit = new Octokit()
const mockedOctokit = mocked(octokit, true)

describe('deployments', () => {
  it('should find a previous deployment', async () => {
    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context
    const environment = 'Production'
    const currentDeployment = 5

    mockedOctokit.rest.repos.listDeployments.mockReturnValueOnce(
      Promise.resolve({
        data: [{id: 5}, {id: 4}, {id: 3}]
      } as any)
    )

    const result = await findPreviousDeploymentForEnvironment(
      mockedOctokit,
      context,
      environment,
      currentDeployment
    )
    expect(result).toBeTruthy()
    expect(result?.id).toBe(4)
    expect(mockedOctokit.rest.repos.listDeployments).toBeCalledWith(
      expect.objectContaining({
        owner: context.repo.owner,
        repo: context.repo.repo,
        environment
      })
    )
  })

  it('should find no deployment if there only is a single one', async () => {
    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context
    const environment = 'Production'
    const currentDeployment = 5

    mockedOctokit.rest.repos.listDeployments.mockReturnValueOnce(
      Promise.resolve({
        data: [{id: 5}]
      } as any)
    )

    const result = await findPreviousDeploymentForEnvironment(
      mockedOctokit,
      context,
      environment,
      currentDeployment
    )
    expect(result).toBeFalsy()
    expect(mockedOctokit.rest.repos.listDeployments).toBeCalledWith(
      expect.objectContaining({
        owner: context.repo.owner,
        repo: context.repo.repo,
        environment
      })
    )
  })
})
