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
        .setName('linkcheck')
        .setDescription('returns all users who are linked but no longer in the guild.'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const axios = require('axios');
        const fs = require('fs');

        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        if (!config.guilds[0]) return interaction.reply({ content: "The Guild ID is not set up properly.\nUse /setguildid to set it up.", ephemeral: true })
        if (config.server.roles.guildmember.id === "undefined") return interaction.reply({ content: "The Guildmember role is not set up properly.\nUse /setguildmemberrole to set it up.", ephemeral: true })

        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        await interaction.deferReply();

        let guild_data = []
        for (let i in [...Array(config.guilds.length).keys()]) {
            let url = `https://api.simple-mmo.com/v1/guilds/members/${config.guilds[i].id}`;
            var api_key = getAPI_Key();
            let response = await axios.post(url, { api_key: api_key });
            if (!response) return interaction.editReply("There has been an error with the API.")

            guild_data.push(response.data)
        }

        //get user link
        let user_link = db_gen.prepare(`SELECT * FROM links`).all();
        
        let userIDList = [];
        let userList = ""
        for (let j = 0;j  < user_link.length;j++){
            let is_member = false;
            guild_data.forEach(guild => {
                for (let i = 0; i < guild.length; i++) {
                    if (guild[i].user_id == user_link[j].SMMO_ID) is_member = true;
                }
            })
            
            if (!is_member) {
                let tempuser = await client.users.fetch(user_link[j].Discord_ID)
                if (tempuser) {
                    if (userList == "") {
                        userList += `[[${tempuser.username}]](https://web.simple-mmo.com/user/view/${user_link[j].SMMO_ID}) - ${user_link[j].SMMO_ID}`
                    } else {
                        userList += `\n[[${tempuser.username}]](https://web.simple-mmo.com/user/view/${user_link[j].SMMO_ID}) - ${user_link[j].SMMO_ID}`
                    }
                } else {
                    if (userList == "") {
                        userList += `[[not a member]](https://web.simple-mmo.com/user/view/${user_link[j].SMMO_ID}) - ${user_link[j].SMMO_ID}`
                    } else {
                        userList += `\n[[not a member]](https://web.simple-mmo.com/user/view/${user_link[j].SMMO_ID}) - ${user_link[j].SMMO_ID}`
                    }
                }
                userIDList.push(user_link[j].Discord_ID);
            }
        }
        
        //ask if users wants to remove users
        if (userIDList[0] != undefined) {
            //output of the userlist
            if (userList.length < 4096){
                let uEmbed = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setThumbnail(client.user.displayAvatarURL(), true)
                    .setTitle("Linked users no longer in guild")
                    .setDescription(`${userList}`)
                interaction.editReply({ embeds: [uEmbed] })
            } else {
                interaction.editReply(`${userList}`)
            }
            
            interaction.channel.send("Would you like to remove these users from the database?").then(msg => {
                msg.react("<:BB_Check:1031690264089202698>");
                msg.react("<:BB_Cross:1031690265334911086>");
                client.on("messageReactionAdd", async (reaction, user) => {
                    if (reaction.emoji.name === "BB_Check" && !user.bot && reaction.message.id == msg.id && user.id === interaction.user.id) {
                        let errorlist = ""
                        let embed = new EmbedBuilder()
                            .setColor('#2f3136')
                            .setTitle(`Error removing Guild Role from`)

                        for (let i = 0;i < userIDList.length;i++){
                            //get user link
                            db_gen.prepare(`DELETE FROM links WHERE Discord_ID=?`).run(userIDList[i]);
                            console.log(userIDList[i])
                            let member = await interaction.guild.members.fetch(userIDList[i]).catch(console.log);
                            
                            try {
                                if (member) {
                                    if (member.roles.cache.find(r => r.name === config.server.roles.guildmember.id)) {
                                        var role = interaction.guild.roles.cache.find(r => r.name == config.server.roles.guildmember.id);
                                        member.roles.remove(role);

                                        for (let i = 0; i < config.guilds.length; i++) {
                                            var role = interaction.guild.roles.cache.find(r => r.name == config.guilds[i].role);
                                            member.roles.remove(role);
                                        }
                                    }
                                } else {
                                    errorlist += `<@${userIDList[i]}>\n`
                                }
                            } catch {
                                errorlist += `<@${userIDList[i]}>\n`
                            }
                        }

                        if (errorlist !== "") {
                            embed.setDescription(errorlist)
                            interaction.channel.send({ embeds: [embed] })
                        }
                        msg.edit("[<:BB_Check:1031690264089202698>] Users have been removed.");
                        msg.reactions.removeAll();
                        return;
                    }
                    if (reaction.emoji.name === "BB_Cross" && !user.bot && reaction.message.id == msg.id && user.id === interaction.user.id) {
                        msg.edit("[<:BB_Cross:1031690265334911086>] Userlist is unchanged.");
                        msg.reactions.removeAll();
                        return;
                    }
                });
            })
        } else {
            return interaction.editReply({ content: "[<:BB_Cross:1031690265334911086>] All linked users are currently in the guild.", ephemeral: true })
        }
    }
}