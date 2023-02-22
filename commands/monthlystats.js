const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('monthlystats')
        .setDescription('shows your monthly stats')
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

        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        else var userLink = link.SMMO_ID;

        let month_ago = helper.getMonthAgo(helper.getToday()).replace(/\-/g, "_")
        try {  var data_then = db_ud.prepare(`SELECT * FROM ud${month_ago} WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${month_ago.replace(/\_/g, "-")}\``, ephemeral: true })
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }
        if (!data_then) return interaction.reply({ content: `You have no DB entry for ${month_ago.replace(/\_/g, "-")}`, ephemeral: true }) 
        
        try{ var data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${date_now.replace(/\_/g, "-")}\``, ephemeral: true })
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }

        let finalEmbed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${userLink}`)
            .setTitle(`[${userLink}] ${data_now.name}`)
            .setDescription(`🗓️ ┊ *__${month_ago.replace(/\_/g, "-")}__ - __${helper.getToday()}__*\n<:blank:1019977634249187368> ┊ *Updated every 10 minutes.*`)
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