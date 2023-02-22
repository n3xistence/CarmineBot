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

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('focuswars')
        .setDescription('blabla'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const axios = require('axios');
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        const warlist = JSON.parse(fs.readFileSync("./data/focuswars.json"))

        if (!warlist[0]) return console.log("no lol")
        warlist.forEach(async war => {
            let guildID = war.id;
            const url = `https://api.simple-mmo.com/v1/guilds/members/${guildID}`;

            let guildnameurl = `https://api.simple-mmo.com/v1/guilds/info/${guildID}`
            var api_key = getAPI_Key();
            if (api_key != null) {
                var guilddata = await axios.post(guildnameurl, { api_key: api_key })
                guilddata = guilddata.data;
            }

            var api_key = getAPI_Key();
            if (api_key != null) {
                async function getUserData() {
                    try {
                        return await axios.post(url, { api_key: api_key });
                    } catch { return null };
                }

                var userList = [];

                getUserData().then(async response => {
                    if (response === null) return 
                    if (!response.data[0]) return 

                    var user_data = response.data;
                    user_data.forEach(gMember => {
                        userList.push([gMember.name, gMember.user_id, gMember.last_activity, gMember.safe_mode, gMember.level])
                    })

                    let safemodeusers = [];
                    for (var k = 0; k < userList.length; k++) {
                        if (userList[k][3] == 0) {
                            safemodeusers.push(userList[k])
                        }
                    }

                    if (userList[0] != undefined) {
                        function sortFunction(a, b) {
                            if (a[4] === b[4]) {
                                return 0;
                            }
                            else {
                                return (a[4] < b[4]) ? -1 : 1;
                            }
                        }
                        userList.sort(sortFunction);

                        var userListString = [];
                        let stringcounter = 0
                        for (var k = 0; k < userList.length; k++) {
                            if (!userListString[stringcounter]) userListString[stringcounter] = ""
                            if (userListString[stringcounter].length < 3800) {
                                if (userList[k][3] == 0) {
                                    userListString[stringcounter] += `[[${userList[k][0]}]](https://web.simple-mmo.com/user/view/${userList[k][1]}) - lvl ${userList[k][4]}\n`;
                                }
                            } else {
                                stringcounter++;
                                k--;
                            }
                        }

                        var embeds = [];
                        for (var i = 0; i < userListString.length; i++) {
                            var embed = new EmbedBuilder()
                                .setColor('#2f3136')
                                .setThumbnail(`https://web.simple-mmo.com/img/icons/${guilddata.icon}`)
                                .setTitle(`**[${guildID}] ${guilddata.name}**`)
                                .setDescription(`Amount: ${safemodeusers.length}\n*Updated every 5 minutes.*\n\n${userListString[i]}`)
                            embeds.push(embed);
                        }

                        let channel = client.channels.cache.get(config.server.channels.focuswars)
                        if (war.msg_id !== "undefined"){
                            let message = await channel.messages.fetch(war.msg_id);
                            await message.edit({ embeds: [embed] }).then(msg => {
                                war.msg_id = msg.id;
                                fs.writeFileSync("./data/focuswars.json", JSON.stringify(warlist));
                            });
                        } else {
                            await channel.send({ embeds: [embed] }).then(msg => {
                                war.msg_id = msg.id;
                                fs.writeFileSync("./data/focuswars.json", JSON.stringify(warlist));
                            })
                        }
                    }
                });
            } else {
                interaction.editReply("the API limit has been reached, try again in 60s.")
            }
        })
    }
}