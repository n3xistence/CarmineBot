const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('advstats')
        .setDescription('shows your stats for the specified time')
        .addStringOption((option) =>
            option
                .setName("starting_date")
                .setDescription("The date further in the past. (DD-MM-YYYY)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("ending_date")
                .setDescription("The date closer to today. (DD-MM-YYYY)")
                .setRequired(true)
        )
        .addStringOption((option) =>
        option
            .setName("user")
            .setDescription("user @ or id")
            .setRequired(false)
    ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        //get the user
        try{ 
            if (interaction.options.getString("user")){
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else { var user = interaction.user; }
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        
        let date_then = interaction.options.getString("starting_date");
        let date_now = interaction.options.getString("ending_date");
        
        if (date_then === date_now) return interaction.reply({ content: `This is the same date... Do you think I'm stupid?`, ephemeral: true })
        if (helper.getEarliestDate([date_then, date_now]) !== date_then) return interaction.reply({ content: `${date_then} - ${date_now}\nThe second date must come after the first.\nYou are not a time traveler...`, ephemeral: true })

        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        else var userLink = link.SMMO_ID;
        
        date_then = date_then.replace(/\-/g, "_");
        try {  var data_then = db_ud.prepare(`SELECT * FROM ud${date_then} WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${date_then.replace(/\_/g, "-")}\``, ephemeral: true })
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }

        if (date_now === helper.getToday()) var file = `UserDataLive`;
        else {
            date_now = date_now.replace(/\-/g, "_")
            var file = `ud${date_now = date_now.replace(/\-/g, "_")}`;
        }

        try{ var data_now = db_ud.prepare(`SELECT * FROM ${file} WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${date_now.replace(/\_/g, "-")}\``, ephemeral: true })
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }

        date_then = date_then.replace(/\_/g, "-");
        date_now = date_now.replace(/\_/g, "-");

        let finalEmbed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${userLink}`)
            .setTitle(`[${userLink}] ${data_now.name}`)
            .setDescription(`🗓️ ┊ *__${date_then}__ - __${date_now}__*\n<:blank:1019977634249187368> ┊ *Updated every 5 minutes.*`)
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
        interaction.reply({ embeds: [finalEmbed] });
    }
}