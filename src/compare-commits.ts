import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'

export const compareCommits = async (
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  currentSha: string,
  previousSha: string
): Promise<{commit: {message: string}}[]> => {
  return octokit.paginate(
    octokit.rest.repos.compareCommits,
    {
      ...context.repo,
      base: previousSha,
      head: currentSha
    },
    response => response.data.commits
  )
}
