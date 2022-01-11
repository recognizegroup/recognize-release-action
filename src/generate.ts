import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import {Deployment} from '@octokit/webhooks-types'
import {GitHub} from '@actions/github/lib/utils'
import {annotateCommit} from './commit-annotator'
import {compareCommits} from './compare-commits'
import {findPreviousDeploymentForEnvironment} from './deployments'
import {generateMarkdownReport} from './markdown-reporter'

export const generateDeploymentReport = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  deployment: Deployment,
  ticketUrl?: string
): Promise<void> => {
  const environment = deployment.environment
  core.info(`Deployment started to ${environment}`)

  // Deployments are sorted by creation date, so the latest one is the first one
  const previousDeployment = await findPreviousDeploymentForEnvironment(
    octokit,
    context,
    environment,
    deployment.id
  )

  if (!previousDeployment) {
    core.warning(`No previous deployment found for ${environment}`)
    return
  }

  const commitsBetween = await compareCommits(
    octokit,
    context,
    deployment.sha,
    previousDeployment.sha
  )

  const commitMessages = commitsBetween.map(it => it.commit.message)
  const report = generateMarkdownReport(
    environment,
    deployment,
    commitMessages,
    ticketUrl
  )

  await annotateCommit(octokit, context, environment, report)

  core.debug(report)
  core.info('Report successfully generated.')
}
