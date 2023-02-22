const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calcdex')
        .setDescription('calculates the dex need to hit the provided def at 100%.')
        .addStringOption((option) =>
            option
                .setName("def")
                .setDescription("your defense")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let def = interaction.options.getString("def");
        if (!Number.isInteger(parseInt(def))) return interaction.reply({ content: "Please provide a valid amount of defense.", ephemeral: true })
        return interaction.reply(`Dex needed to hit ${def} at 100": __${Math.floor((2 * parseInt(def)) / 7)}__`);
    }
}