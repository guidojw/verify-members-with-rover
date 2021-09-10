import type { GetUsersByUserIds } from '@guidojw/bloxy/dist/client/apis/UsersAPI'
import { robloxAdapter } from '../adapters'
import { util } from '../util'

export type GetUsers = GetUsersByUserIds['data']

const { split } = util

export async function getUsers (userIds: number[]): Promise<GetUsers> {
  let result: GetUsers = []
  const chunks = split(userIds, 100)
  for (const chunk of chunks) {
    result = result.concat((await robloxAdapter('POST', 'users', 'v1/users', {
      userIds: chunk,
      excludeBannedUsers: false
    })).data.data)
  }
  return result
}
