const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calcdmg')
        .setDescription('calculates the dex need to hit the provided def at 100%.')
        .addStringOption((option) =>
            option
                .setName("str")
                .setDescription("your strength")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("def")
                .setDescription("enemy defense")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let str = interaction.options.getString("str");
        let def = interaction.options.getString("def");
        if (!Number.isInteger(parseInt(def))) return interaction.reply({ content: "Please provide a valid amount of defense.", ephemeral: true })
        if (!Number.isInteger(parseInt(str))) return interaction.reply({ content: "Please provide a valid amount of strength.", ephemeral: true })
        let min_dmg = (parseInt(str - (11 / 9 * parseInt(def))));
        let max_dmg = (parseInt(str - (9 / 11 * parseInt(def))));

        return interaction.reply(`You will hit for __${min_dmg} - ${max_dmg}__ damage.`)
    }
}