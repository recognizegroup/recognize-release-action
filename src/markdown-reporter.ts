import {Deployment} from '@octokit/webhooks-types'
import dayjs from 'dayjs'
import {listTicketsInMessages} from './ticket-links'

export const generateMarkdownReport = (
  environment: string,
  deployment: Deployment,
  commitMessages: string[],
  ticketUrl?: string
): string => {
  const tickets = listTicketsInMessages(commitMessages)
  const startedAt = dayjs(deployment.created_at).format(
    'dddd D MMMM YYYY HH:mm Z'
  )

  return addTicketLinksToText(
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
}

export const addTicketLinksToText = (
  text: string,
  ticketUrl?: string
): string => {
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
