const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mercs')
        .setDescription('shows all currently enlisted mercenaries'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))
        const merc_data = JSON.parse(fs.readFileSync("./data/merc_data.json"));

        if (!config.guilds[0]) return interaction.reply({ content: `The guild name is not set up properly properly.`, ephemeral: true });
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let userstring = ""
        for (var i = 0; i < merc_data.length; i++) {
            userstring += `${i+1}. <@${merc_data[i].id}> - ${merc_data[i].kills} kills.\n`
        }

        if (userstring === "") return interaction.reply({ content: "There are currently no enlisted mercenaries", ephemeral: true })
        
        let embed = new EmbedBuilder()
            .setTitle(`Currently enlisted mercenaries in ${config.guilds[0].name}`)
            .setColor('DarkRed')
            .setDescription(`${userstring}`)
            .setTimestamp()

        return interaction.reply({ embeds: [embed] })
    }
}