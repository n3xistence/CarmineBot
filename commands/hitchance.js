const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hitchance')
        .setDescription('calculates the hitchance.')
        .addStringOption((option) =>
            option
                .setName("dex")
                .setDescription("your dexterity")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("def")
                .setDescription("your opponent's defense")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let dex = interaction.options.getString("dex");
        let def = interaction.options.getString("def");
        let hitchance = (7 / 2 * (parseFloat(dex) / parseFloat(def)));
        if (hitchance > 1) { hitchance = 1 };
        hitchance = hitchance.toFixed(2);
        hitchance *= 100;

        return interaction.reply(`You have a ${hitchance}% chance to hit the target of ${def} defense with ${dex} dexterity.`);
    }
}