export const listTicketsInMessages = (messages: string[]): string[] => {
  const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/g

  return [...new Set(messages.flatMap(it => it.match(regex) ?? []))]
}
