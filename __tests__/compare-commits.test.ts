import {it, expect, describe, jest} from '@jest/globals'
import {Context} from '@actions/github/lib/context'
import {Octokit} from '@octokit/rest'
import {mocked} from 'jest-mock'
import {compareCommits} from '../src/compare-commits'

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(() => ({
      paginate: jest.fn(),
      rest: {
        repos: {
          compareCommits: jest.fn()
        }
      }
    }))
  }
})

const octokit = new Octokit()
const mockedOctokit = mocked(octokit, true)

describe('compare commits', () => {
  it('should return a list commits between two shas', async () => {
    const context = {
      repo: {
        owner: 'recognizegroup',
        repo: 'recognize-release-action'
      }
    } as unknown as Context
    const currentSha = '1'
    const previousSha = '2'

    mockedOctokit.paginate.mockReturnValue(
      Promise.resolve([
        {commit: {message: 'TD-1 - First'}},
        {commit: {message: 'TD-2 - Second'}}
      ])
    )

    const result = await compareCommits(
      mockedOctokit,
      context,
      currentSha,
      previousSha
    )
    expect(result).toEqual([
      {commit: {message: 'TD-1 - First'}},
      {commit: {message: 'TD-2 - Second'}}
    ])
    expect(mockedOctokit.paginate).toBeCalledWith(
      mockedOctokit.rest.repos.compareCommits,
      expect.objectContaining({
        owner: context.repo.owner,
        repo: context.repo.repo,
        base: previousSha,
        head: currentSha
      }),
      expect.anything()
    )
  })
})
