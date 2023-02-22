const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('http');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('requestcomplete')
        .setDescription('completes a worship request (or all)')
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("the number of the request you would like to complete (or 'all' to complete all)")
                .setChoices(
                    { name: "worship", value: "worship" },
                    { name: "moe", value: "moe" }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("index")
                .setDescription("the number of the request you would like to complete (or 'all' to complete all)")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let requests = JSON.parse(fs.readFileSync("./data/requests.json"));
        let index = (interaction.options.getString("index") === "all") ? "all" : parseInt(interaction.options.getString("index"));
        if (!Number.isInteger(index) && index !== "all") return interaction.reply({ content: `Please provide a valid request to complete.`, ephemeral: true });
        
        await interaction.deferReply();

        let type = interaction.options.getString("type");
        if (type === "worship") {
            if (index > requests.worship.length) return interaction.reply({ content: `There are less than ${index} requests. Please provide a valid request to complete.`, ephemeral: true });

            if (index === "all") {
                for (var i = 0; i < requests.worship.length; i++) {
                    var user_id = requests.worship[i].id;

                    await interaction.channel.send({
                        content: `<@${user_id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setDescription(`[<:BB_Check:1031690264089202698>] Your ${type} request has been completed. Please check your inventory.`)
                        ]
                    });
                }
                requests.worship = [];
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return await interaction.editReply("[<:BB_Check:1031690264089202698>] All requests completed.")
            } else {
                if (index > requests.worship.length) return interaction.reply({ content: `There are less than ${index} requests. Please provide a valid request to complete.`, ephemeral: true });
                if (index < 1) return interaction.reply({ content: `Please provide a valid index. You provided ${index}. There are ${index} requests.`, ephemeral: true });
    
                index -= 1;
                var user_id = requests.worship[index].id;
                requests.worship.splice(index, 1);
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return await interaction.editReply({
                    content: `<@${user_id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(`[<:BB_Check:1031690264089202698>] Your ${type} request has been completed. Please check your inventory.`)
                    ]
                });
            }
        } else if (type === "moe"){
            if (index > requests.moes.length) return interaction.reply({ content: `There are less than ${index} requests. Please provide a valid request to complete.`, ephemeral: true });

            if (index === "all") {
                for (var i = 0; i < requests.moes.length; i++) {
                    var user_id = requests.moes[i].id;

                    await interaction.channel.send({
                        content: `<@${user_id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setDescription(`[<:BB_Check:1031690264089202698>] Your ${type} request has been completed. Please check your inventory.`)
                        ]
                    });
                }
                requests.moes = [];
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return await interaction.editReply("[<:BB_Check:1031690264089202698>] All requests completed.")
            } else {
                index -= 1;
                var user_id = requests.moes[index].id;
                requests.moes.splice(index, 1);
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return await interaction.editReply({
                    content: `<@${user_id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(`[<:BB_Check:1031690264089202698>] Your request has been completed. Please check your inventory.`)
                    ]
                });
            }
        }
    }
}