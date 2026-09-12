import { Handler } from '@netlify/functions'

import { getFirstUserId } from './database/User'

export const handler: Handler = async () => {
  try {
    await getFirstUserId()
    console.log('Daily schedule completed')

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Daily schedule completed' }),
    }
  } catch (error) {
    console.error('Daily schedule failed:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Daily schedule failed' }),
    }
  }
}
