import * as core from '@actions/core'
import * as github from '@actions/github'
import {DeploymentEvent, PushEvent} from '@octokit/webhooks-types'

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

    const latestDeployments = octokit.rest.repos.listDeployments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      environment
    })
    core.info(JSON.stringify(latestDeployments))
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
