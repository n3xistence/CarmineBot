const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('patchinfo')
        .setDescription('displays information about the current patch'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let sEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setTitle("Patchnotes")
            .addFields(
                { name: "**Current Version:**", value: `${version}`},
                { name: "**Notable Changes:**", value: (
                    "\n- fixed quests being non responsive```") })
        return interaction.reply({ embeds: [sEmbed] });
    }
}