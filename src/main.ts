import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  Commit,
  Deployment,
  DeploymentEvent,
  PushEvent
} from '@octokit/webhooks-types'

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
      core.info(`No previous deployment found for ${environment}`)
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
    core.info(`Commits in deployment: ${commitMessages.join(', ')}`)

    core.info(JSON.stringify(latestDeployments))
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
