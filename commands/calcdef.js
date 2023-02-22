const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calcdef')
        .setDescription('calculates the def you can hit at 100% with the provided dex.')
        .addStringOption((option) =>
            option
                .setName("dex")
                .setDescription("your dexterity")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let dex = interaction.options.getString("dex");
        if (!Number.isInteger(parseInt(dex))) return interaction.reply({ content: "Please provide a valid amount of dexterity.", ephemeral: true })
        return interaction.reply(`Max def you can hit at 100% with ${dex} dex: __${Math.floor((7 * parseInt(dex)) / 2)}__`);
    }
}