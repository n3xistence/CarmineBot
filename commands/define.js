const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('defines a thing')
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("the thing to define")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const axios = require('axios');
        var searchTerm = interaction.options.getString("query")

        var options = {
            method: 'GET',
            url: 'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
            params: { term: searchTerm },
            headers: {
                'x-rapidapi-host': 'mashape-community-urban-dictionary.p.rapidapi.com',
                'x-rapidapi-key': '3e68261a3dmsh37bf0c02787633dp1480f7jsn5ed62a01e793'
            }
        };

        var resultList = [];
        axios.request(options).then(function (response) {
            response.data.list.forEach(entry => {
                resultList.push(entry.definition);
            });
            if (resultList[0] == undefined) {
                return interaction.reply({ content: "No definition found for " + searchTerm, ephemeral: true })
            } else {
                return interaction.reply("**Definition for " + searchTerm + ":**\n\n" + resultList[0]);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }
}