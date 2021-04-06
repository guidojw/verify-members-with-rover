verify-members-with-rover
================
[![Discord](https://discordapp.com/api/guilds/761634353859395595/embed.png)](https://discord.gg/tJFNC5Y)

Updates all members in your guild with their [RoVer](https://github.com/evaera/RoVer) verification data.

### Features
* update nickname to username known with RoVer
* add role when `VERIFIED_ROLE_ID` is specified
* optionally exclude roles from `EXCLUDE_ROLE_IDS`
* output a JSON file listing the still unverified members

**NOTE**: the bot you're going to do this with must have its `GUILD_MEMBERS` [intent](https://discord.com/developers/docs/topics/gateway#gateway-intents) enabled on the Discord Developer Portal! 
## Prerequisites
* [Node.js](https://nodejs.org/en/download/current/)

## Installation
1. Install prerequisites
2. Install packages with `npm install`
3. Copy the `.env.example` to `.env` and set the values
4. In `app.js`, change the constants (`GUILD_ID`, `VERIFIED_ROLE_ID`, `EXCLUDE_ROLES_IDS` & `OUTPUT_CHANNEL_ID`) as desired

## Usage
To start, run:

    npm start
