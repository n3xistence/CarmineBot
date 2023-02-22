const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcesyncdaily')
        .setDescription('forces the daily db to be resynced'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        if (interaction.user.id !== "189764769312407552") return interaction.reply({ content: "This Command is not for you.", ephemeral: true })
    
        try {
            let filename = helper.getYesterday(helper.getToday()).replace(/\-/g, "_");
            const cmd = db_ud.prepare(
                `CREATE TABLE ud${filename} AS SELECT * FROM UserDataLive WHERE 1 = 1`
            );
            cmd.run();
            return interaction.reply({ content: "Successfully synced daily DB", ephemeral: true});
        } catch (e) {
            console.log(e)
            return interaction.reply({ content: "Error syncing daily DB", ephemeral: true});
        }
    }
}