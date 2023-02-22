const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('worshiprequests')
        .setDescription('shows all worship requests'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        const requests = JSON.parse(fs.readFileSync("./data/requests.json"));

        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let userstring = ""
        for (var i = 0; i < requests.worship.length; i++) {
            userstring += `${i+1}. <@${requests.worship[i].id}> - [[📦 Send Item](https://simplemmo.me/mobile/?page=inventory?sendid=${requests.worship[i].link})]\n`
        }

        if (userstring === "") return interaction.reply({ content: "There are currently no requests.", ephemeral: true })
        
        return interaction.reply({ 
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Current worship requests`)
                    .setColor('DarkRed')
                    .setDescription(`${userstring}`)
                    .setTimestamp()
            ]
        })
    }
}