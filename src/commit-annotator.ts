import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'

export const annotateCommit = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  environment: string,
  report: string
): Promise<void> => {
  // Add annotation
  const name = `Deployment report to ${environment}`

  await octokit.rest.checks.create({
    head_sha: context.sha,
    name,
    status: 'completed',
    conclusion: 'neutral',
    output: {
      title: name,
      summary: report
    },
    ...context.repo
  })
}
