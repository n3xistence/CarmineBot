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

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guildattackcheck')
        .setDescription('returns all users who are out of safemode in the mantioned guild (ID)')
        .addStringOption((option) =>
            option
                .setName("guildid")
                .setDescription("ID of the guild you want to check")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply()

        const axios = require('axios');
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        let user = interaction.user;

        let guildID = interaction.options.getString("guildid");
        if (guildID && !Number.isInteger(parseInt(guildID))) return interaction.reply({ content: "Invalid Guild ID", ephemeral: true })
        if (!guildID) guildID = config.guilds[0].id;

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

            getUserData().then(response => {
                if (response === null) return interaction.editReply({ content: "API Error", ephemeral: true })
                if (!response.data[0]) return interaction.editReply({ content: `No guild found with id \`${guildID}\``, ephemeral: true })
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

                if (userList[0] === undefined) return interaction.editReply({ content: "There are no users out of safemode.", ephemeral: true })

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
                    if (userListString[stringcounter].length < 900) {
                        if (userList[k][3] == 0) {
                            userListString[stringcounter] += `[[${userList[k][0]}]](https://simplemmo.me/mobile/?page=user/view/${userList[k][1]}) - lvl ${userList[k][4]}\n`;
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
                        .addFields({ name: "List", value: userListString[i] })
                        .setDescription(`Amount: ${safemodeusers.length}\n`)
                        .setFooter({ text: `Page ${i + 1} / ${userListString.length}` })
                        .setTimestamp()
                    embeds.push(embed);
                }

                //pagination
                if (embeds[1] == undefined) {
                    return interaction.editReply({ embeds: [embeds[0]] });
                } else {
                    function returnPaginationRow(counter) {
                        row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('back_all')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⏪')
                                    .setDisabled(counter === 0),
                                new ButtonBuilder()
                                    .setCustomId('back')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⬅️')
                                    .setDisabled(counter === 0),
                                new ButtonBuilder()
                                    .setCustomId('end')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⏹️'),
                                new ButtonBuilder()
                                    .setCustomId('forward')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('➡️')
                                    .setDisabled(counter === (embeds.length - 1)),
                                new ButtonBuilder()
                                    .setCustomId('forward_all')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⏩')
                                    .setDisabled(counter === (embeds.length - 1)),
                            );
                        return row;
                    }

                    interaction.editReply({ embeds: [embeds[0]], components: [returnPaginationRow(0)] }).then(msg => {
                        var counter = 0;
                        const listener = async (interaction) => {
                            if (!interaction.message) return
                            if (interaction.user.id !== user.id) return;
                            if (interaction.message.id !== msg.id) return;

                            if (interaction.customId === "back_all") {
                                counter = 0;
                                interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                            }
                            if (interaction.customId === "back" && (counter - 1 >= 0)) {
                                counter--;
                                interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                            }
                            if (interaction.customId === "forward" && (counter + 1 < embeds.length)) {
                                counter++;
                                interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                            }
                            if (interaction.customId === "forward_all") {
                                counter = embeds.length - 1;
                                interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                            }
                            if (interaction.customId === "end") {
                                interaction.update({ embeds: [embeds[counter]], components: [] });
                                client.off("interactionCreate", listener)
                            }
                            await new Promise(resolve => setTimeout(() => {
                                try {
                                    client.off("interactionCreate", listener)
                                } catch { }
                                resolve();
                            }, 120000));
                        }
                        client.on("interactionCreate", listener)
                    });
                }
                //end of pagination
            });
        } else {
            interaction.editReply("the API limit has been reached, try again in 60s.")
        }
    }
}