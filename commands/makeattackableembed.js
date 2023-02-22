const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getAPI_Key() {
    const fs = require("fs");
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
        .setName('makeattackableembed')
        .setDescription('creates an embed in the focus war channel to display user HP, level and attackable status'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        const axios = require('axios');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let guildID = config.guilds[0].id;
        let guilddata = "";

        let guildnameurl = `https://api.simple-mmo.com/v1/guilds/info/${guildID}`
        var api_key = getAPI_Key();
        if (api_key === null) return interaction.reply({ conten: "API error, try again in 1 minute.", ephemeral: true });
        
        async function getGuildData() {
            try {
                return await axios.post(guildnameurl, { api_key: api_key })
            } catch { return null; }
        }
        getGuildData().then(response => {
            if (response === null || !response) return console.log("Error getting guild info")
            guilddata = response.data;
        })
        
        let url = `https://api.simple-mmo.com/v1/guilds/members/${guildID}`;
        var api_key = getAPI_Key();
        if (api_key === null) return interaction.reply({ conten: "API error, try again in 1 minute.", ephemeral: true });

        async function getUserData() {
            try {
                return await axios.post(url, { api_key: api_key });
            } catch { return null };
        }

        var userList = [];

        getUserData().then(response => {
            if (response === null) return null;
            var user_data = response.data;
            user_data.forEach(gMember => {
                if (gMember.safe_mode == 0) userList.push([gMember.name, gMember.user_id, gMember.last_activity, gMember.safe_mode, gMember.level, gMember.current_hp, gMember.max_hp])
            })

            let attackable_list = []
            let dead_list = []
            for (let i = 0; i < userList.length; i++) {
                if ((userList[i][5] / userList[i][6]) >= 0.5) {
                    attackable_list.push(userList[i])
                } else {
                    dead_list.push(userList[i])
                }
            }

            if (!userList[0]) return null;

            function sortFunction(a, b) {
                if (a[4] === b[4]) {
                    return 0;
                }
                else {
                    return (a[4] < b[4]) ? -1 : 1;
                }
            }
            attackable_list.sort(sortFunction);
            dead_list.sort(sortFunction);

            let attackableString = "";
            for (var k = 0; k < attackable_list.length; k++) {
                if (attackableString.length < 3800) {
                    if (attackable_list[k][3] == 0) {
                        let userHP = `${((attackable_list[k][5] / attackable_list[k][6]).toFixed(3) * 100).toString().substring(0, 4)}%`
                        attackableString += `[[${attackable_list[k][0]}]](https://web.simple-mmo.com/user/view/${attackable_list[k][1]}) - LVL: ${attackable_list[k][4]} - HP ${userHP}\n`;
                    }
                }
            }

            let deadString = "";
            for (var k = 0; k < dead_list.length; k++) {
                if (deadString.length < 850) {
                    if (dead_list[k][3] == 0) {
                        let userHP = `${((dead_list[k][5] / dead_list[k][6]).toFixed(3) * 100).toString().substring(0, 4)}%`
                        deadString += `[[${dead_list[k][0]}]](https://web.simple-mmo.com/user/view/${dead_list[k][1]}) - lvl ${dead_list[k][4]} - HP ${userHP}\n`;
                    }
                }
            }

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`refresh_guildies`)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔄')
                );

            let channel = client.channels.cache.get(config.server.channels.focuswars)
            var embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setThumbnail(`https://web.simple-mmo.com/img/icons/${guilddata.icon}`)
                .setTitle(`Attackable Guildies`)
                .setDescription(`${(attackableString.length > 0) ? attackableString : "None"}`)
                .addFields({ name: "Not Attackable Yet", value: `${(deadString.length > 0) ? deadString : "None"}` })
            channel.send({ embeds: [embed], components: [row] }).then(msg => {
                fs.writeFileSync("./data/attackable_guildies.json", JSON.stringify({ "msg_id": msg.id }));
            })
            return interaction.reply({ content: `Embed created in ${channel}`, ephemeral: true })
        })
    }
}