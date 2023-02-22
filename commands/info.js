const { SlashCommandBuilder, EmbedBuilder, ReactionCollector } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('displays information about the server'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let link_data = db_gen.prepare(`SELECT * FROM links`).all();
        let owner = await interaction.guild.fetchOwner()

        let created = Math.floor(new Date(interaction.guild.createdAt)/1000)

        let sEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setThumbnail(interaction.guild.iconURL(), true)
            .setTitle(`${interaction.guild.name} Server Info`)
            .addFields(
                { name: "**Server Name**", value: `${interaction.guild.name}`, inline: true },
                { name: "**Server Owner**", value: `${owner}`, inline: true },
                { name: "**Member Count**", value: `${interaction.guild.memberCount}`, inline: true },
                { name: "**Linked Users**", value: `${link_data.length}`, inline: true },
                { name: "**Created At**", value: `<t:${created}:R> (<t:${created}:d>)`, inline: true },
                { name: "**Version**", value: `${version}`, inline: true }
            )
        interaction.reply({ embeds: [sEmbed] });
    }
}