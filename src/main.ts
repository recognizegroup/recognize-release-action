import * as core from '@actions/core'
import * as github from '@actions/github'
import {DeploymentEvent} from '@octokit/webhooks-types'
import {generateDeploymentReport} from './generate'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
    const ticketUrl = core.getInput('ticket-url', {required: false})
    const octokit = github.getOctokit(token)

    if (github.context.eventName !== 'deployment') {
      core.warning(
        `Skipping action, because it can only be used for deployment triggers at this moment.`
      )

      return
    }

    const deploymentEvent = github.context.payload as DeploymentEvent
    const deployment = deploymentEvent.deployment

    await generateDeploymentReport(
      octokit,
      github.context,
      deployment,
      ticketUrl
    )
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
