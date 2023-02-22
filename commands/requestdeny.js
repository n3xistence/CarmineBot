const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('requestdeny')
        .setDescription('denies a worship request (or all)')
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("the request type")
                .setChoices(
                    { name: "worship", value: "worship" },
                    { name: "moe", value: "moe" }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("index")
                .setDescription("the number of the request you would like to deny (or 'all' to complete all)")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let requests = JSON.parse(fs.readFileSync("./data/requests.json"));
        let index = (interaction.options.getString("index") === "all") ? "all" : parseInt(interaction.options.getString("index"));
        if (!Number.isInteger(index) && index !== "all") return interaction.reply({ content: `Please provide a valid request to complete.`, ephemeral: true });
        if (index > requests.worship.length) return interaction.reply({ content: `There are less than ${index} requests. Please provide a valid request to complete.`, ephemeral: true });

        let type = interaction.options.getString("type");
        if (type === "worship") {
            if (index === "all") {
                for (var i = 0; i < requests.worship.length; i++) {
                    var user_id = requests.worship[i].id;
                    var user_link = requests.worship[i].link;

                    interaction.channel.send({
                        content: `<@${user_id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`[<:BB_Cross:1031690265334911086>] Your ${type} request has been denied.`)
                        ]
                    });
                }
                requests.worship = [];
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return interaction.reply("[<:BB_Cross:1031690265334911086>] All requests denied.")
            } else {
                index -= 1;
                var user_id = requests.worship[index].id;
                var user_link = requests.worship[index].link;
                requests.worship.splice(index, 1);
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return interaction.reply({
                    content: `<@${user_id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`[<:BB_Cross:1031690265334911086>] Your ${type} request has been denied.`)
                    ]
                });
            }
        } else if(type === "moe") {
            if (index === "all") {
                for (var i = 0; i < requests.moes.length; i++) {
                    var user_id = requests.moes[i].id;
                    var user_link = requests.moes[i].link;

                    interaction.channel.send({
                        content: `<@${user_id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`[<:BB_Cross:1031690265334911086>] Your ${type} request has been denied.`)
                        ]
                    });
                }
                requests.moes = [];
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return interaction.reply("[<:BB_Cross:1031690265334911086>] All requests denied.")
            } else {
                index -= 1;
                var user_id = requests.moes[index].id;
                var user_link = requests.moes[index].link;
                requests.moes.splice(index, 1);
                fs.writeFileSync("./data/requests.json", JSON.stringify(requests));

                return interaction.reply({
                    content: `<@${user_id}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`[<:BB_Cross:1031690265334911086>] Your ${type} request has been denied.`)
                    ]
                });
            }
        }
    }
}