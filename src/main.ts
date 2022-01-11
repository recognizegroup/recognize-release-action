import * as core from '@actions/core'
import * as github from '@actions/github'
import {DeploymentEvent} from '@octokit/webhooks-types'
import dayjs from 'dayjs'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
    const reportType = core.getInput('report_type', {required: true})
    const ticketUrl = core.getInput('ticket_url', {required: true})
    const octokit = github.getOctokit(token)

    if (github.context.eventName !== 'deployment') {
      core.warning(
        `Skipping action, because it can only be used for deployment triggers at this moment.`
      )
    }

    const deploymentEvent = github.context.payload as DeploymentEvent
    const deployment = deploymentEvent.deployment

    const environment = deployment.environment
    core.info(`Deployment started to ${environment}`)

    const latestDeployments = await octokit.rest.repos.listDeployments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      environment
    })

    // Deployments are sorted by creation date, so the latest one is the first one
    const previousDeployment = latestDeployments.data.find(
      it => it.id !== deployment.id
    )

    if (!previousDeployment) {
      core.warning(`No previous deployment found for ${environment}`)
      return
    }

    const compareShas = async (
      currentSha: string,
      previousSha: string
    ): Promise<{commit: {message: string}}[]> => {
      return octokit.paginate(
        octokit.rest.repos.compareCommits,
        {
          ...github.context.repo,
          base: previousSha,
          head: currentSha
        },
        response => response.data.commits
      )
    }

    const commitsBetween = await compareShas(
      deployment.sha,
      previousDeployment.sha
    )
    const commitMessages = commitsBetween.map(it => it.commit.message)

    const startedAt = dayjs(deployment.created_at).format(
      'dddd MMMM YYYY HH:mm'
    )
    const previousUrl = deployment.url

    const listTicketsInMessages = (messages: string[]): string[] => {
      const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/g

      return [...new Set(messages.flatMap(it => it.match(regex) ?? []))]
    }
    const tickets = listTicketsInMessages(commitMessages)

    const addTicketLinksToText = (text: string, ticketUrl: string): string => {
      if (!ticketUrl) return text
      const tickets = listTicketsInMessages([text])

      return tickets.reduce(
        (value, ticket) =>
          value.replace(
            new RegExp(ticket, 'ig'),
            `[${ticket}](${ticketUrl.replace('<ticket>', ticket)})`
          ),
        text
      )
    }

    const report = addTicketLinksToText(
      `
| Environment    | Started at   | Previous deployment |
| -------------- | ------------ | ------------------- |
| ${environment} | ${startedAt} | #${deployment.id}   |

## Commits
${
  commitMessages.length === 0
    ? 'No commits found.'
    : commitMessages.map(it => `- ${it}`).join('\n')
}

## Tickets
${tickets.length === 0 ? 'No tickets found.' : tickets.join(', ')}
`,
      ticketUrl
    )

    if (reportType === 'commit') {
      // Add annotation
      const name = `Deployment report to ${environment}`

      await octokit.rest.checks.create({
        head_sha: github.context.sha,
        name,
        status: 'completed',
        conclusion: 'neutral',
        output: {
          title: name,
          summary: report
        },
        ...github.context.repo
      })
    } else {
      throw new Error('Unsupported report type')
    }

    core.info(report)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
