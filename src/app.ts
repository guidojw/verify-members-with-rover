import './extensions'
import { Client, Collection, MessageAttachment, TextChannel } from 'discord.js'
import type { GuildMember } from 'discord.js'
import type { VerificationData } from './extensions'
import dotenv from 'dotenv'
import fs from 'fs'
import { userService } from './services'

dotenv.config()

// Change the constants below:
const GUILD_ID: string = ''
const VERIFIED_ROLE_ID: string | null = null
const EXCLUDE_ROLE_IDS: string[] = []
const OUTPUT_CHANNEL_ID: string | null = null
const ROVER_SMARTNAME_FORMAT: boolean = false

const UPDATE_INTERVAL = 0.333 * 1000

async function start (): Promise<void> {
  const client = new Client()
  await client.login(process.env.DISCORD_TOKEN)

  // Validate guild.
  const guild = client.guilds.cache.get(GUILD_ID)
  if (typeof guild === 'undefined') {
    console.error('Invalid guild, stopping..')
    return
  }

  // Validate roles.
  if (VERIFIED_ROLE_ID !== null && !guild.roles.cache.has(VERIFIED_ROLE_ID)) {
    console.error(`Invalid verified role "${VERIFIED_ROLE_ID}", stopping..`)
    return
  }
  for (const excludeRoleId of EXCLUDE_ROLE_IDS) {
    if (!guild.roles.cache.has(excludeRoleId)) {
      console.error(`Invalid excluded role "${excludeRoleId}", stopping..`)
      return
    }
  }

  // Validate output channel.
  let outputChannel
  if (OUTPUT_CHANNEL_ID !== null) {
    outputChannel = guild.channels.cache.get(OUTPUT_CHANNEL_ID)
    if (typeof outputChannel === 'undefined' || !(outputChannel instanceof TextChannel)) {
      console.error(`Invalid output channel "${OUTPUT_CHANNEL_ID}", stopping..`)
      return
    }
  }

  // Fetch and filter members to be verified.
  const members = (await guild.members.fetch())
    .filter(member => !member.user.bot && (VERIFIED_ROLE_ID === null || !member.roles.cache.has(VERIFIED_ROLE_ID)))
    .filter(member => member.roles.cache.every(role => !EXCLUDE_ROLE_IDS.includes(role.id)))

  console.log(`About to update ${members.size} members`)

  // Get the members' verification data from the RoVer API.
  const verifieds: Collection<string, VerificationData> = new Collection()
  const notVerifieds = []
  for (const member of members.values()) {
    await sleep(Math.max(UPDATE_INTERVAL, 0.333 * 1000))

    let verificationData = null
    try {
      verificationData = await member.fetchVerificationData()
    } catch (err) {
      console.error(`RoVer API returned an error for member ${member.user.tag}, continuing to next`)
      notVerifieds.push(member.id)
      continue
    }
    if (verificationData == null) {
      console.log(`Member ${member.user.tag} is not verified with RoVer, adding to the not-verifieds array`)
      notVerifieds.push(member.id)
      continue
    }

    verifieds.set(member.id, verificationData)
  }

  await fs.promises.writeFile('./temp-verifieds.json', JSON.stringify(verifieds.toJSON(), null, '\t'))
  await fs.promises.writeFile('./temp-not-verifieds.json', JSON.stringify(notVerifieds, null, '\t'))

  // If RoVer's smart name format is used, get the Roblox user data of each
  // userId, check if they have a displayName set and then set their nickname
  // and optionally give the verified role.
  // Otherwise just set the nickname to the one retrieved from RoVer and
  // optionally give the verified role.
  const promises = []
  if (ROVER_SMARTNAME_FORMAT) {
    const robloxData = await userService.getUsers([
      ...new Set(verifieds.map(verificationData => verificationData.robloxId))
    ])

    for (const [memberId, verificationData] of verifieds.entries()) {
      const member = members.get(memberId) as GuildMember
      const robloxUser = robloxData.find(user => user.id === verificationData.robloxId)
      if (typeof robloxUser !== 'undefined') {
        const memberPromises = getMemberPromises(
          member,
          robloxUser.name !== robloxUser.displayName
            ? `${robloxUser.displayName} (${robloxUser.name})`
            : robloxUser.name
        )
        if (memberPromises.length > 0) {
          promises.push(Promise.all(memberPromises))
        }
      } else {
        const memberPromises = getMemberPromises(member, verificationData.robloxUsername)
        if (memberPromises.length > 0) {
          promises.push(Promise.all(memberPromises))
        }
      }
    }
  } else {
    for (const [memberId, verificationData] of verifieds.entries()) {
      const member = members.get(memberId) as GuildMember
      const memberPromises = getMemberPromises(member, verificationData.robloxUsername)
      if (memberPromises.length > 0) {
        promises.push(Promise.all(memberPromises))
      }
    }
  }

  // Await all set nickname/give verified role promises and then count the
  // fulfilled ones.
  const promiseResults = await Promise.allSettled(promises)
  const verifiedAmount = promiseResults.filter(result => result.status === 'fulfilled').length

  // Write not verifieds to a JSON file.
  const outputFileName = `${Date.now()}-not-verifieds.json`
  await fs.promises.writeFile(`./${outputFileName}`, JSON.stringify(notVerifieds, null, '\t'))

  // Optionally send not verifieds as attachment to a channel.
  if (typeof outputChannel !== 'undefined') {
    const attachment = new MessageAttachment(
      Buffer.from(JSON.stringify(notVerifieds, null, '\t')),
      outputFileName
    )
    await outputChannel.send(
      `Successfully verified **${verifiedAmount}** members, the following **${notVerifieds.length}** members weren't verified because they aren't verified with RoVer or the RoVer API returned an error:`,
      attachment
    )
  }

  console.log(`Successfully verified ${verifiedAmount} members. ${notVerifieds.length} members weren't verified because they aren't verified with RoVer or the RoVer API returned an error`)

  client.destroy()
}

async function sleep (ms: number): Promise<void> {
  return await new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function getMemberPromises (member: GuildMember, newNickname: string): Array<Promise<GuildMember>> {
  const memberPromises = []
  if (member.displayName !== newNickname) {
    memberPromises.push(member.setNickname(newNickname))
  }
  if (VERIFIED_ROLE_ID !== null && !member.roles.cache.has(VERIFIED_ROLE_ID)) {
    memberPromises.push(member.roles.add(VERIFIED_ROLE_ID))
  }
  return memberPromises
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start()
