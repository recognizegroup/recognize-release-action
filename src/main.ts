import * as core from '@actions/core'
import * as github from '@actions/github'
import {DeploymentEvent} from '@octokit/webhooks-types'
import dayjs from 'dayjs'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
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
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
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

    const listTicketsInCommitMessages = (messages: string[]): string[] => {
      const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/g

      return [...new Set(messages.flatMap(it => it.match(regex) ?? []))]
    }
    const tickets = listTicketsInCommitMessages(commitMessages)

    const report = `
| Environment    | Started at   | Previous deployment                 |
| -------------- | ------------ | ----------------------------------- |
| ${environment} | ${startedAt} | [#${deployment.id}](${previousUrl}) |

## Commits
${
  commitMessages.length === 0
    ? 'No commits found.'
    : commitMessages.map(it => `- ${it}`).join('\n')
}

## Tickets
${tickets.length === 0 ? 'No tickets found.' : tickets.join(', ')}
`

    core.info(report)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
