const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventtask')
        .setDescription('displays your current event task and progress'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        //get data
        let link_data = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(interaction.user.id);
        if (!link_data) return interaction.reply({ content: "You are not linked. Run /gverify to link your account.", ephemeral: true });
        let link = link_data.SMMO_ID;

        let user_event_data = db_gen.prepare(`SELECT * FROM EventData WHERE id=?`).get(link);
        if (!user_event_data) return interaction.reply({ content: "You do not currently have a task. Please wait a few minutes and try again.\nIf the problem persists, please contact n3xistence#0003", ephemeral: true });
        
        let user_data = db_ud.prepare(`select name from sqlite_master where type='table'`).all()
            .filter(elem => elem.name.startsWith("ud"))
            .map(elem => elem.name.replace(/\_/g, "-").replace("ud", ""));

        user_data.sort(function (a, b) {
            return new Date(helper.date_to_ISO8601(a)) - new Date(helper.date_to_ISO8601(b));
        })

        let db_then = user_data[user_data.length - 1].replace(/\-/g, "_");
        let data_then = db_ud.prepare(`SELECT * FROM ud${db_then} WHERE id=?`).get(link);
        let data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link);
        if (!data_then || !data_now) return interaction.reply({ content: "Missing Data entry.\nIf the problem persists, please contact n3xistence#0003", ephemeral: true });;

        let progress = 0;
        let notice = "";
        switch (user_event_data.type) {
            case 'levels':
                progress = data_now.level - data_then.level;
                notice = `<:BB_Levels:1027227604144640030> ┊ `
                break;
            case 'steps':
                progress = data_now.steps - data_then.steps;
                notice = `<:BB_Steps:1027227609723047966> ┊ `
                break;
            case 'NPCs':
                progress = data_now.npc - data_then.npc;
                notice = `<:BB_NPC:1027227605650391102> ┊ `
                break;
            case 'players':
                progress = data_now.pvp - data_then.pvp;
                notice = `<:BB_PVP:1027227607034515456> ┊ `
                break;
            case 'quests':
                progress = data_now.quests - data_then.quests;
                notice = `<:BB_Quests:1027227608267636816> ┊ `
                break;
            case 'tasks':
                progress = data_now.tasks - data_then.tasks;
                notice = `<:BB_Tasks:1027227610993938472> ┊ `
                break;
            default:
                return interaction.reply({ content: "There has been an error processing your request.\nPlease contact n3xistence#0003 for help.", ephemeral:true });
        }

        //create the progress bar
        let progressBar = "";
        var z = ((progress / user_event_data.value) * 100);
        for (var i = 0; i < 100; i += 5) {
            if (z - 5 >= 0) {
                progressBar += "▰";
                z -= 5;
            } else {
                progressBar += "▱";
            }
        }

        return interaction.reply({
            content:`❄️ ┊ Your current task:\n${notice}${user_event_data.description} (${progress}/${user_event_data.value})\n${progressBar}`,
            ephemeral: true
        })
    }
}