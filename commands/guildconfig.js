const { SlashCommandBuilder, EmbedBuilder, ReactionCollector } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guildconfig')
        .setDescription('displays the guild config'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs')
        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        let string = ""
        for (let i = 0;i < config.guilds.length;i++){
            if (i === 0) string += `[Main Guild](https://simplemmo.me/mobile/?page=guilds/view/${config.guilds[i].id}):\nName: ${config.guilds[i].name}\nID: ${config.guilds[i].id}\nRole: <@&${config.guilds[i].role}>\n\n`
            else string += `[Guild ${i+1}](https://simplemmo.me/mobile/?page=guilds/view/${config.guilds[i].id}):\nName: ${config.guilds[i].name}\nID: ${config.guilds[i].id}\nRole: <@&${config.guilds[i].role}>\n\n`
        }

        let sEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setTitle(`${interaction.guild.name} Guild Config`)
            .setDescription(`${string}`)

        return interaction.reply({ embeds: [sEmbed] });
    }
}