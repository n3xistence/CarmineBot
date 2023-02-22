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
        .setName('adminlink')
        .setDescription('links the account of a user')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("user @ or id")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("your SMMO ID")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply();

        var url = 'https://api.simple-mmo.com/v1/player/info/';
        const axios = require('axios');
        const fs = require("fs");

        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        var api_key = getAPI_Key();
        if (!api_key) return interaction.editReply({ content: "The API limit has been reached, try again in 1 minute.", ephemeral: true })

        let errors = "";

        //validate the inputs
        if (!interaction.options.getString("id") || !Number.isInteger(parseInt(interaction.options.getString("id")))) return interaction.editReply({ content: "You must provide an ID", ephemeral: true })
        else var inputID = interaction.options.getString("id");

        //get the user
        try {
            if (interaction.options.getString("user")) {
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true });
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        //request API data
        async function getUserData() {
            try {
                return await axios.post(`${url}${inputID}`, { api_key: api_key });
            } catch (err) {
                console.log("[3;33m[x] - error with the SMMO api (code 01)[0m" + err)
                return null;
            }
        }

        getUserData().then(response => {
            if (response === null) return interaction.editReply({ content: "Fatal API error.", ephemeral: true })
            let user_data = response.data;

            let user_check = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id);
            if (user_check) {
                var user_is_linked = true;
                var linked_to = user_check.SMMO_ID;
            }

            let verify_embed = new EmbedBuilder()
                .setDescription(`Are you sure you would like to add ${user} to \n${user_data.name} (Level ${user_data.level})?\n${(user_is_linked) ? `\nUser is currently linked to \`${linked_to}\`` : ""}`)
                .setThumbnail(`https://web.simple-mmo.com${user_data.avatar}`)

            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('deny')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                )
            interaction.editReply({ embeds: [verify_embed], components: [row] }).then(msg => {
                const listener = async (i) => {
                    if (user.bot) return;

                    if (i.customId === "verify") {
                        //check if the ID is already linked
                        let link_check = db_gen.prepare(`SELECT * FROM links WHERE SMMO_ID=?`).get(inputID);
                        if (link_check) {
                            interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                                msg.react("<:BB_Cross:1031690265334911086>")
                            })

                            return i.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setDescription(`This ID is already linked to <@${link_check.Discord_ID}>`)
                                ], components: []
                            });
                        }

                        if (user_is_linked) {
                            let status = db_gen.prepare(`UPDATE links SET SMMO_ID=? WHERE Discord_ID=?`).run(inputID, user.id);
                            if (!status) {
                                interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                                    msg.react("<:BB_Cross:1031690265334911086>")
                                })
                                return i.reply({ content: "Fatal error.", embeds: [], components: [] })
                            }
                        } else {
                            try {
                                let cmd = db_gen.prepare(`INSERT INTO links VALUES (?, ?, ?)`).run(user.id, inputID, 0);
                            } catch {
                                interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                                    msg.react("<:BB_Cross:1031690265334911086>")
                                })
                                return i.reply({ content: "Fatal error.", embeds: [], components: [] })
                            }
                        }

                        if (!user_data.guild){
                            interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                                msg.react("<:BB_Cross:1031690265334911086>")
                            })
                            return i.reply({ content: "User must be a member of a guild.", embeds: [], components: [] })
                        }

                        let payload = [user_data.id, user_data.name, user_data.level, user_data.steps, user_data.npc_kills, user_data.user_kills, user_data.quests_performed, user_data.tasks_completed, user_data.boss_kills, user_data.bounties_completed, user_data.safeMode, user_data.current_location.name, user_data.current_location.id, user_data.guild.id]

                        //add on-join entry
                        try {
                            let join_check = db_ud.prepare(`SELECT * FROM JoinData WHERE id=?`).get(inputID);
                            if (!join_check) {
                                let cmd = db_ud.prepare(`INSERT INTO JoinData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                                cmd.run(...payload);
                            }
                        } catch { errors += "*- Weekly DB Error*\n"; }

                        //add entry to weekly DB
                        let weekly_check = db_ud.prepare(`SELECT * FROM UserData WHERE id=?`).get(inputID);
                        if (!weekly_check) {
                            let cmd = db_ud.prepare(`INSERT INTO UserData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                            cmd.run(...payload);
                        }

                        //add entry to boss DB
                        let boss_check = db_ud.prepare(`SELECT * FROM BossUserData WHERE id=?`).get(inputID);
                        if (!boss_check) {
                            let cmd = db_ud.prepare(`INSERT INTO BossUserData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                            cmd.run(...payload);
                        }

                        //add entry to yesterday's DB so user can check stats
                        let date = helper.getYesterday(helper.getToday()).replace(/\-/g, "_");
                        try {
                            let yesterday_check = db_ud.prepare(`SELECT * FROM ud${date} WHERE id=?`).get(inputID);
                            if (!yesterday_check) {
                                let cmd = db_ud.prepare(`INSERT INTO ud${date} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                                cmd.run(...payload);
                            }
                        } catch {
                            try {
                                date = helper.getPastDate(helper.getToday(), 2).replace(/\-/g, "_");
                                let yesterday_check = db_ud.prepare(`SELECT * FROM ud${date} WHERE id=?`).get(inputID);
                                if (!yesterday_check) {
                                    let cmd = db_ud.prepare(`INSERT INTO ud${date} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                                    cmd.run(...payload);
                                }
                            } catch {
                                errors += "*- Fatal Yesterday DB Error*\n";
                            }
                        }

                        //add entry to Live DB so users don't have to wait for sync after linking
                        try {
                            let live_check = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(inputID);
                            if (!live_check) {
                                let cmd = db_ud.prepare(`INSERT INTO UserDataLive VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                                cmd.run(...payload);
                            }
                        } catch { errors += "*- Live DB Error*\n" }

                        client.off("interactionCreate", listener);
                        interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                            msg.react("<:BB_Check:1031690264089202698>")
                        })

                        let member = await interaction.guild.members.fetch(user.id);

                        //universal role
                        var role = client.guilds.cache.get(config.server.id).roles.cache.find(r => r.id === config.server.roles.guildmember.id)
                        member.roles.add(role);

                        //guild specific role
                        if (user_data.guild) {
                            for (let i = 0; i < config.guilds.length; i++) {
                                if (user_data.guild.id == config.guilds[i].id) {
                                    let role = client.guilds.cache.get(config.server.id).roles.cache.find(r => r.id === config.guilds[i].role)
                                    member.roles.add(role);
                                }
                            }
                        }

                        return i.reply({ content: `Finished linking with the following errors:\n${(errors === "") ? "*none*" : `${errors}`}`, ephemeral: true })
                    }

                    //deny reaction
                    if (i.customId === "deny") {
                        interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                            msg.react("<:BB_Cross:1031690265334911086>")
                        })

                        var denyembed = new EmbedBuilder()
                            .setThumbnail(`https://web.simple-mmo.com${user_data.avatar}`)
                            .setColor('Red')
                            .setDescription(`${user} has not been added.`)

                        client.off("interactionCreate", listener);
                        return i.update({ embeds: [denyembed], components: [] })
                    }
                };
                client.on("interactionCreate", listener);
            });
        });
    }
}