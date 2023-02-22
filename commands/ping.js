const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!'),
    async execute (interaction, Discord, client, version, helper, db_gen, db_ud){
        interaction.reply({
            content: "Pong!",
            ephemeral: true
        });
    }
}