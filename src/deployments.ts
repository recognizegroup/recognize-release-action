import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'

export const findPreviousDeploymentForEnvironment = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  environment: string,
  currentDeploymentId: number
): Promise<{id: number; sha: string} | undefined> => {
  const latestDeployments = await octokit.rest.repos.listDeployments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    environment
  })

  // Deployments are sorted by creation date, so the latest one is the first one
  return latestDeployments.data.find(it => it.id !== currentDeploymentId)
}
