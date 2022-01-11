import {it, expect, describe} from '@jest/globals'
import {generateMarkdownReport} from '../src/markdown-reporter'
import {Deployment} from '@octokit/webhooks-types'

describe('markdown reporter', () => {
  it('should generate a markdown report based on a simple set of inputs with ticket links', async () => {
    const environment = 'Production'
    const deployment = {
      created_at: '2022-01-11T09:32:51Z',
      id: 134
    } as unknown as Deployment
    const commitMessages = ['TD-1 - Work in progress']
    const ticketUrl = 'https://test.atlassian.net/browse/<ticket>'
    const report = generateMarkdownReport(
      environment,
      deployment,
      commitMessages,
      ticketUrl
    )

    expect(report).toContain('Production')
    expect(report).toContain(' Tuesday 11 January 2022')
    expect(report).toContain('#134')
    expect(report).toContain(
      '## Commits\n' +
        '- [TD-1](https://test.atlassian.net/browse/TD-1) - Work in progress'
    )
    expect(report).toContain(
      '## Tickets\n[TD-1](https://test.atlassian.net/browse/TD-1)'
    )
  })

  it('should generate a markdown report based on a simple set of inputs without ticket links', async () => {
    const environment = 'Production'
    const deployment = {
      created_at: '2022-01-11T09:32:51Z',
      id: 134
    } as unknown as Deployment
    const commitMessages = ['TD-1 - Work in progress']
    const report = generateMarkdownReport(
      environment,
      deployment,
      commitMessages
    )

    expect(report).toContain('- TD-1 - Work in progress')
    expect(report).toContain('## Tickets\nTD-1')
  })

  it('should generate a markdown report based on empty data', async () => {
    const environment = 'Production'
    const deployment = {
      created_at: '2022-01-11T09:32:51Z',
      id: 134
    } as unknown as Deployment
    const commitMessages = []
    const report = generateMarkdownReport(
      environment,
      deployment,
      commitMessages
    )

    expect(report).toContain('## Commits\nNo commits found.')
    expect(report).toContain('## Tickets\nNo tickets found.')
  })
})
