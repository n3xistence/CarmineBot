const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getAPI_Key() {
    const fs = require('fs')

    let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
    if (api_data[0].limit >= 40) {
        if (api_data[1].limit >= 40) {
            if (api_data[2].limit >= 40) {
                return null;
            } else {
                api_data[2].limit++;
                fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
                return api_data[2].key;
            }
        } else {
            api_data[1].limit++;
            fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
            return api_data[1].key;
        }
    } else {
        api_data[0].limit++;
        fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
        return api_data[0].key;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkmissing')
        .setDescription('lists all users who are not linked'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply();

        const axios = require('axios')
        const fs = require('fs')

        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        if (!config.guilds[0]) return interaction.editReply({ content: "The Guild ID is not set up correctly.\nUse /setguildid to set it up.", ephemeral: true })
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        var roleID = config.server.roles.guildmember.id;
        const list = client.guilds.cache.get(interaction.guild.id);

        const url = `https://api.simple-mmo.com/v1/guilds/members/${config.guilds[0].id}`;
        var api_key = getAPI_Key();
        if (api_key === null) return interaction.editReply({ content: "Error with the API, try again in a minute. If this error persists, contact n3xistence#0003.", ephemeral: true })

        async function getUserData() {
            try {
                return await axios.post(url, { api_key: api_key });
            } catch (err) {
                console.log(err)
                return null
            };
        }

        getUserData().then(async (response) => {
            if (!response) return;
            if (response === null) return;
            let memberlist = response.data;

            let string = "";
            list.roles.cache.get(roleID).members.map(member => {
                //get user link
                var link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(member.id);
                if (!link) {
                    string += `\n<@${member.id}>`

                    memberlist.forEach(gMember => {
                        if (gMember.name.toLowerCase() === member.nickname?.toLowerCase() || gMember.name.toLowerCase() === member.user.username.toLowerCase()) string += ` - [${gMember.user_id}]`
                    })
                }
            })
            if (string === "") return interaction.editReply({ content: "All users are linked.", ephemeral: true })

            if (string.length < 4096 && string.length > 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle("Unlinked users with guild role:")
                            .setDescription(`${string}`)
                    ]
                })
            } else { return interaction.editReply({ content: "Error", ephemeral: true }) }
        })
    }
}