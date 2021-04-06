'use strict'

require('dotenv').config()

const fs = require('fs')

const { Client, MessageAttachment } = require('discord.js')

// Change the constants below:
const GUILD_ID = ''
const VERIFIED_ROLE_ID = ''
const EXCLUDE_ROLE_IDS = ['', '', '']
const OUTPUT_CHANNEL_ID = ''

const OUTPUT_FILE_NAME = 'not-verifieds.json'
const UPDATE_INTERVAL = 0.333 * 1000

require('../extensions')

async function start () {
  const client = new Client()
  await client.login(process.env.DISCORD_TOKEN)

  const guild = client.guilds.cache.get(GUILD_ID)
  const members = (await guild.members.fetch())
    .filter(member => !member.user.bot && !member.roles.cache.has(VERIFIED_ROLE_ID))
    .filter(member => member.roles.cache.every(role => !EXCLUDE_ROLE_IDS.includes(role.id)))

  console.log(`About to update ${members.size} members`)

  const verifieds = []
  const notVerifieds = []
  const promises = []
  for (const member of members.values()) {
    await sleep(Math.max(UPDATE_INTERVAL, 0.333 * 1000))

    const verificationData = await member.fetchVerificationData()
    if (!verificationData) {
      console.log(`Member ${member.user.tag} is not verified with RoVer, adding to the not-verifieds array`)
      notVerifieds.push(member.id)
      continue
    }

    promises.push(Promise.all([
      member.setNickname(verificationData.robloxUsername),
      VERIFIED_ROLE_ID ? member.roles.add(VERIFIED_ROLE_ID) : null
    ]).then(() => {
      verifieds.push(member.id)
      console.log(`Verified ${member.user.tag}`)
    }))
  }
  await Promise.all(promises)

  const channel = guild.channels.cache.get(OUTPUT_CHANNEL_ID)
  if (channel) {
    const attachment = new MessageAttachment(
      Buffer.from(JSON.stringify(notVerifieds, null, '\t')),
      OUTPUT_FILE_NAME
    )
    await channel.send(
      `Successfully verified **${verifieds.length}** members, the following **${notVerifieds.length}** members weren't verified because they aren't verified with RoVer:`,
      attachment
    )
  }

  await fs.promises.writeFile(`./${OUTPUT_FILE_NAME}`, JSON.stringify(notVerifieds, null, '\t'))

  client.destroy()
}

function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

start()
