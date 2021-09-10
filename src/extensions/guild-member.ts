import type { GuildMember } from 'discord.js'
import { Structures } from 'discord.js'
import { roVerAdapter } from '../adapters'

export interface VerificationData {
  robloxId: number
  robloxUsername: string
}

declare module 'discord.js' {
  interface GuildMember {
    fetchVerificationData: () => Promise<VerificationData | null>
  }
}

// @ts-expect-error
const AroraGuildMember: GuildMember = Structures.extend('GuildMember', GuildMember => {
  class AroraGuildMember extends GuildMember {
    // @ts-expect-error
    public override async fetchVerificationData (): Promise<VerificationData | null> {
      try {
        return await fetchRoVerData(this.id)
      } catch {}
    }
  }

  return AroraGuildMember
})

export default AroraGuildMember

async function fetchRoVerData (userId: string): Promise<VerificationData | null> {
  try {
    return (await roVerAdapter('GET', `user/${userId}`)).data
  } catch (err: any) {
    if (err.response?.data?.errorCode === 404) {
      return null
    }
    throw err.response?.data?.error ?? err
  }
}
