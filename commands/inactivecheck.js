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
        .setName('inactivecheck')
        .setDescription('returns all users who have been inactive for at least 2 days.')
        .addStringOption((option) =>
            option
                .setName("arg")
                .setDescription("additional argument")
                .setRequired(false)
                .addChoices(
                    { name: "PVP", value: "PVP" },
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let axios = require('axios');
        let fs = require('fs');
        let args = interaction.options.getString("arg");

        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        if (!config.guilds[0]) return interaction.reply({ content: "The Guild ID is not set up properly.\nUse /setguildid to set it up.", ephemeral: true })
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        const url = `https://api.simple-mmo.com/v1/guilds/members/${config.guilds[0].id}`;

        await interaction.deferReply()

        if (!args) {
            var api_key = getAPI_Key();
            if (api_key != null) {
                async function getUserData() {
                    try {
                        return await axios.post(url, { api_key: api_key });
                    } catch { return null };
                }

                var userList = [];

                getUserData().then(response => {
                    if (response === null) return interaction.editReply({ content: "API Error", ephemeral: true })

                    var user_data = response.data;
                    user_data.forEach(gMember => {
                        if (Math.floor((Math.floor(Date.now() / 1000) - gMember.last_activity) / 86400) > 1) {
                            userList.push([gMember.name, gMember.user_id, gMember.last_activity, gMember.safe_mode])
                        }
                    })

                    if (userList[0] != undefined) {
                        function sortFunction(a, b) {
                            if (a[2] === b[2]) {
                                return 0;
                            }
                            else {
                                return (a[2] > b[2]) ? -1 : 1;
                            }
                        }
                        userList.sort(sortFunction);

                        var userListString = [];
                        userListString[0] = ""
                        userListString[1] = ""
                        for (var k = 0; k < userList.length; k++) {
                            if (userListString[0].length < 960) {
                                if (userList[k][3] == 1) {
                                    userListString[0] += "🚩";
                                } else {
                                    userListString[0] += "⚔️";
                                }
                                userListString[0] += "[[" + userList[k][0] + "]](https://web.simple-mmo.com/user/view/" + userList[k][1] + ") - " + Math.floor((Math.floor(Date.now() / 1000) - userList[k][2]) / 86400) + " days.\n";
                            } else {
                                if (userList[k][3] == 1) {
                                    userListString[1] += "🚩";
                                } else {
                                    userListString[1] += "⚔️";
                                }
                                userListString[1] += "[[" + userList[k][0] + "]](https://web.simple-mmo.com/user/view/" + userList[k][1] + ") - " + Math.floor((Math.floor(Date.now() / 1000) - userList[k][2]) / 86400) + " days.\n";
                            }
                        }

                        try {
                            let uEmbed = new EmbedBuilder()
                                .setColor('#2f3136')
                                .setThumbnail(client.user.displayAvatarURL(), true)
                                .addFields(
                                    { name: "Inactive Users", value: `${userListString[0]}` }
                                )
                                .setTimestamp()
                            if (userListString[1].length > 0) {
                                uEmbed.setDescription(`${userListString[1]}`)
                            }
                            interaction.editReply({ embeds: [uEmbed] })
                        } catch {
                            interaction.editReply("Userlist: \n" + userListString)
                        }
                    } else {
                        interaction.editReply({ content: "There are no users in the guild inactive for 2 days or longer.", ephemeral: true })
                    }
                });
            } else {
                interaction.editReply("the API limit has been reached, try again in 60s.")
            }
        } else {
            var api_key = getAPI_Key();
            async function getUserData() {
                try {
                    return await axios.post(url, { api_key: api_key });
                } catch (err){ 
                    console.log(err)
                    return null 
                };
            }

            var userList = [];

            getUserData().then(response => {
                if (response === null) return interaction.editReply({ content: "API Error", ephemeral: true })

                var user_data = response.data;
                user_data.forEach(gMember => {
                    if (Math.floor((Math.floor(Date.now() / 1000) - gMember.last_activity) / 86400) > 1 && (gMember.safe_mode === 0)) {
                        userList.push([gMember.name, gMember.user_id, gMember.last_activity, gMember.safe_mode])
                    }
                })

                if (userList[0] != undefined) {
                    function sortFunction(a, b) {
                        if (a[2] === b[2]) {
                            return 0;
                        }
                        else {
                            return (a[2] > b[2]) ? -1 : 1;
                        }
                    }
                    userList.sort(sortFunction);

                    var userListString = [];
                    userListString[0] = ""
                    userListString[1] = ""
                    for (var k = 0; k < userList.length; k++) {
                        if (userListString[0].length < 960) {
                            if (userList[k][3] == 1) {
                                userListString[0] += "🚩";
                            } else {
                                userListString[0] += "⚔️";
                            }
                            userListString[0] += "[[" + userList[k][0] + "]](https://web.simple-mmo.com/user/view/" + userList[k][1] + ") - " + Math.floor((Math.floor(Date.now() / 1000) - userList[k][2]) / 86400) + " days.\n";
                        } else {
                            if (userList[k][3] == 1) {
                                userListString[1] += "🚩";
                            } else {
                                userListString[1] += "⚔️";
                            }
                            userListString[1] += "[[" + userList[k][0] + "]](https://web.simple-mmo.com/user/view/" + userList[k][1] + ") - " + Math.floor((Math.floor(Date.now() / 1000) - userList[k][2]) / 86400) + " days.\n";
                        }
                    }

                    try {
                        let uEmbed = new EmbedBuilder()
                            .setColor('#2f3136')
                            .setThumbnail(client.user.displayAvatarURL(), true)
                            .addFields(
                                { name: "Inactive Users out of safemode", value: `${userListString[0]}` }
                            )
                            .setTimestamp()
                        if (userListString[1].length > 0) {
                            uEmbed.setDescription(`${userListString[1]}`)
                        }
                        interaction.editReply({ embeds: [uEmbed] })
                    } catch {
                        interaction.editReply("Userlist: \n" + userListString)
                    }
                } else {
                    interaction.editReply({ content: "There are no users in the guild inactive for 24h or longer and out of safemode.", ephemeral: true })
                }
            });
        }
    }
}