import type { GetUsersByUserIds } from '@guidojw/bloxy/dist/client/apis/UsersAPI'
import axios from 'axios'
import { robloxAdapter } from '../adapters'
import { util } from '../util'

export type GetUsers = GetUsersByUserIds['data']

const { sleep, split } = util

const REQUEST_COOLDOWN = 60_000

export async function getUsers (userIds: number[]): Promise<GetUsers> {
  let result: GetUsers = []
  const chunks = split(userIds, 100)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      result = result.concat((await robloxAdapter('POST', 'users', 'v1/users', {
        userIds: chunk,
        excludeBannedUsers: false
      })).data.data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        await sleep(REQUEST_COOLDOWN)
        i--
        continue
      }
      throw err
    }
  }
  return result
}
