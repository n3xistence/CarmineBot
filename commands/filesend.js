const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filesend')
        .setDescription('sends a file')
        .addStringOption((option) =>
            option
                .setName("filename")
                .setDescription("name of the file")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs')
        
        if (!interaction.user.id === "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true })
        let filename = interaction.options.getString("filename").toLowerCase();
        
        const files = fs.readdirSync('./data');

        for (let i = 0;i<files.length;i++){
            if ((`${filename}.json` === files[i])){
                return interaction.reply({ files: [`./data/${files[i]}`] })
            }
        }
        return interaction.reply({ content: `No such file`, ephemeral: true })
    }
}
