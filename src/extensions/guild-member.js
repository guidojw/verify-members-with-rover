'use strict'

const { Structures } = require('discord.js')
const { roVerAdapter } = require('../adapters')

const VerifiableGuildMember = Structures.extend('GuildMember', GuildMember => {
  class VerifiableGuildMember extends GuildMember {
    async fetchVerificationData () {
      try {
        return await fetchRoVerData(this.id, this.guild.id)
      } catch {}
    }
  }

  return VerifiableGuildMember
})

async function fetchRoVerData (userId) {
  let response
  try {
    response = (await roVerAdapter('get', `/user/${userId}`)).data
  } catch (err) {
    if (err.response?.data?.errorCode === 404) {
      return null
    }
    throw err.response?.data?.error ?? err
  }

  return {
    robloxUsername: response.robloxUsername,
    robloxId: response.robloxId
  }
}

module.exports = VerifiableGuildMember
