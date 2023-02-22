const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('versioninfo')
        .setDescription('displays information about the current version'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let sEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setTitle("Version Info")
            .addFields(
                { name: "**Current Version:**", value: `${version}` },
                { name: "**IMPORTANT:**", value: (
                        "\n-> no major changes```") }
                )

        return interaction.reply({ embeds: [sEmbed] });
    }
}