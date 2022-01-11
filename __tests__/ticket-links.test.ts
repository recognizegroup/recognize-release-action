import {it, expect, describe} from '@jest/globals'
import {listTicketsInMessages} from '../src/ticket-links'

describe('ticket links', () => {
  it('should find all tickets in a list of strings', async () => {
    const input = [
      'Testing with TD-1',
      'TD-0 Fixed commit',
      'Some ticket TD--123 in the middle of the string',
      'AZ-1 and AZ-2',
      'PROJECT-2 A test with a longer project name'
    ]
    const result = listTicketsInMessages(input)

    expect(result).toEqual(['TD-1', 'TD-0', 'AZ-1', 'AZ-2', 'PROJECT-2'])
  })

  it('should not find anything in a string without tickets', async () => {
    const input = ['Some ticket story']
    const result = listTicketsInMessages(input)

    expect(result).toEqual([])
  })

  it('should not find anything in a string without strings', async () => {
    const input = []
    const result = listTicketsInMessages(input)

    expect(result).toEqual([])
  })
})
