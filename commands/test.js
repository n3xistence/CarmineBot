const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getLinkedDate(userid, db_gen, db_ud, helper) {
    let user_data = db_ud.prepare(`select name from sqlite_master where type='table'`).all()
        .filter(elem => elem.name.startsWith("ud"))
        .map(elem => elem.name.replace(/\_/g, "-").replace("ud", ""));

    user_data.sort(function (a, b) {
        return new Date(helper.date_to_ISO8601(a)) - new Date(helper.date_to_ISO8601(b));
    })

    //get user link
    let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(userid); 
    if (!link) return false;
    link = link.SMMO_ID;

    let date = user_data[user_data.length-1]
    let data_then = db_ud.prepare(`SELECT * FROM ud${date.replace(/\-/g, "_")} WHERE id=?`).get(link)
    while (data_then){
        try{
            date = helper.getYesterday(date)
            data_then = db_ud.prepare(`SELECT * FROM ud${date.replace(/\-/g, "_")} WHERE id=?`).get(link)
        } catch { data_then = undefined }
    }
    date = helper.getTomorrow(date);
    
    return date;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('run a test'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        return interaction.reply({ content: "No test active", ephemeral: true })
    }
}