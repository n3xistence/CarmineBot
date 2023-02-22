const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goal')
        .setDescription('Shows the days it would take for you to reach a specified goal.')
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("The Type of stat you are trying to reach a goal for.")
                .setRequired(true)
                .addChoices(
                    { name: "Levels", value: "Levels" },
                    { name: "Steps", value: "Steps" },
                    { name: "NPC", value: "NPC" },
                    { name: "PVP", value: "PVP" },
                    { name: "Quests", value: "Quests" },
                    { name: "Tasks", value: "Tasks" },
                    { name: "Bosses", value: "Bosses" },
                    { name: "Bounties", value: "Bounties" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("goal")
                .setDescription("The goal you would like to reach (integer)")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let user = interaction.user;
        let stat_type = interaction.options.getString("type");
        let goal = parseInt(interaction.options.getString("goal"));

        if (!Number.isInteger(goal)) return interaction.reply({ content: "Your goal must be an integer", ephemeral: true })

        if (interaction.options.getString("goal")[interaction.options.getString("goal").length - 1] == "k"){
            goal *= 1000;
        } else if (interaction.options.getString("goal")[interaction.options.getString("goal").length - 1] == "m"){
            goal *= 1000000;
        }

        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) interaction.reply({ content: `You are unlinked. Use /gverify to link your account.`, ephemeral: true });
        else var userLink = link.SMMO_ID;

        let date_then = helper.getPastDate(helper.getToday(), 7).replace(/\-/g, "_");

        //get user data
        try { var data_then = db_ud.prepare(`SELECT * FROM ud${date_then} WHERE id=?`).get(link.SMMO_ID) } 
        catch {
            if (e.message.startsWith("no such table")) return interaction.reply({ content: `No database for \`${date_then.replace(/\_/g, "-")}\``, ephemeral: true })
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true })
        }

        try{ var data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            console.log(e)
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }

        let days = 0;
        switch (stat_type){
            case "Steps":
                var progress = ((data_now.steps - data_then.steps) / 7)
                days = (goal - data_now.steps) / progress;
                break;
            case "Levels":
                var progress = ((data_now.level - data_then.level) / 7)
                days = (goal - data_now.level) / progress;
                break;
            case "NPC":
                var progress = ((data_now.npc - data_then.npc) / 7)
                days = (goal - data_now.npc) / progress;
                break;
            case "PVP":
                var progress = ((data_now.pvp - data_then.pvp) / 7)
                days = (goal - data_now.pvp) / progress;
                break;
            case "Quests":
                var progress = ((data_now.quests - data_then.quests) / 7)
                days = (goal - data_now.quests) / progress;
                break;
            case "Tasks":
                var progress = ((data_now.tasks - data_then.tasks) / 7)
                days = (goal - data_now.tasks) / progress;
                break;
            case "Bosses":
                var progress = ((data_now.bosses - data_then.bosses) / 7)
                days = (goal - data_now.bosses) / progress;
                break;
            case "Bounties":
                var progress = ((data_now.bounties - data_then.bounties) / 7)
                days = (goal - data_now.bounties) / progress;
                break;
        }

        let finalEmbed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${userLink}`)
            .setTitle(`[${userLink}] ${user.username}`)
            .setDescription(`🗓️ ┊ *Uses average stat gains of past 7 days*\n\nBased on your daily progress of **${progress.toFixed(2)} ${stat_type}/day** it would take you **${days.toFixed(2)} days** to reach your goal of **${numberWithCommas(goal)} ${stat_type}**.`)
            .setTimestamp();
        return interaction.reply({ embeds: [finalEmbed] });
    }
}