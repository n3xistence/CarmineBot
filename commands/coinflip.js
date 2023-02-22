const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('randomly picks one of the two options.')
        .addStringOption((option) =>
            option
                .setName("option1")
                .setDescription("option 1")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("option2")
                .setDescription("option 2")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let option1 = interaction.options.getString("option1");
        let option2 = interaction.options.getString("option2");
        var roll = Math.floor(Math.random() * 2);
        
        if (roll == 1) return interaction.reply(`I choose: ${option1}`)
        else return interaction.reply(`I choose: ${option2}`)
    }
}