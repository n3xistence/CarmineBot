const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('shows your daily stats')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("user @ or id")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("arg")
                .setDescription("additional arguments")
                .setRequired(false)
                .addChoices(
                    { name: "yesterday", value: "yesterday" }
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs')
        let user_data = db_ud.prepare(`select name from sqlite_master where type='table'`).all()
            .filter(elem => elem.name.startsWith("ud"))
            .map(elem => elem.name.replace(/\_/g, "-").replace("ud", ""));

        user_data.sort(function (a, b) {
            return new Date(helper.date_to_ISO8601(a)) - new Date(helper.date_to_ISO8601(b));
        })

        //get the user
        try {
            if (interaction.options.getString("user")) {
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else { var user = interaction.user; }
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        let date_then = helper.getYesterday(helper.getToday()).replace(/\-/g, "_");
        if (interaction.options.getString("arg") === "yesterday") {
            date_then = user_data[user_data.length-2].replace(/\-/g, "_");
        }

        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        
        //get user data
        try { var data_then = db_ud.prepare(`SELECT * FROM ud${date_then} WHERE id=?`).get(link.SMMO_ID) } 
        catch {
            try {
                date_then = helper.getYesterday(date_then).replace(/\-/g, "_");
                var data_then = db_ud.prepare(`SELECT * FROM ud${date_then} WHERE id=?`).get(link.SMMO_ID)
            } catch (e) {
                if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${date_then.replace(/\_/g, "-")}\``, ephemeral: true })
                return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true })
            }
        }
        if (!data_then) return interaction.reply({ content: "You have no DB entry for yesterday", ephemeral: true }) 


        if (interaction.options.getString("arg") === "yesterday") {
            var date_now = user_data[user_data.length-1].replace(/\-/g, "_");
        } else {
            var date_now = helper.getToday().replace(/\-/g, "_");
        }
        
        try{ var data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            console.log(e)
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }
        if (!data_now) return interaction.reply({ content: "You have no live DB entry", ephemeral: true }) 

        date_then = date_then.replace(/\_/g, "-");
        date_now = date_now.replace(/\_/g, "-");

        let finalEmbed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${link.SMMO_ID}`)
            .setTitle(`[${link.SMMO_ID}] ${data_now.name}`)
            .setDescription(`${(interaction.options.getString("arg") === "yesterday") ? `<:blank:1019977634249187368> ┊ __*Yesterday Stats*__\n` : ""}🗓️ ┊ *__${date_then}__ - __${date_now}__*\n<:blank:1019977634249187368> ┊ *Updated every 10 minutes.*`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "**Levels:**", value: `${(data_now.level - data_then.level)} <:BB_Levels:1027227604144640030> `, inline: true },
                { name: "**Steps:**", value: `${(data_now.steps - data_then.steps)} <:BB_Steps:1027227609723047966> `, inline: true },
                { name: "**NPC kills:**", value: `${(data_now.npc - data_then.npc)} <:BB_NPC:1027227605650391102>`, inline: true },
                { name: "**PVP kills:**", value: `${(data_now.pvp - data_then.pvp)} <:BB_PVP:1027227607034515456>`, inline: true },
                { name: "**Quests:**", value: `${(data_now.quests - data_then.quests)} <:BB_Quests:1027227608267636816> `, inline: true },
                { name: "**Tasks:**", value: `${(data_now.tasks - data_then.tasks)} <:BB_Tasks:1027227610993938472> `, inline: true },
                { name: "**Boss kills:**", value: `${(data_now.bosses - data_then.bosses)} <:BB_Boss:1027227600784982077> `, inline: true },
                { name: "**Bounties:**", value: `${(data_now.bounties - data_then.bounties)} <:BB_Bounties:1027227602320097361> `, inline: true }
            )
            .setTimestamp();
        return interaction.reply({ embeds: [finalEmbed] });
    }
}