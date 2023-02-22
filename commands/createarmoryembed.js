const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createarmoryembed')
        .setDescription('create a reaction embed for the armory role'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let fs = require('fs');
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let finalEmbed = new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setColor('#2f3136')
            .setTitle("Armory Role")
            .addFields({
            name: "*Rules:*", value: "Armory requests are limited by Discord activity; If you are LEVEL 3 you can request one legendary item and if you are LEVEL 8 you can" +
                " request one additional celestial item for a maximum of two items. We are working with a loan system, so the items will not be yours to keep, only to use.\n" +
                "ALL THE ITEMS REMAIN GUILD PROPERTY. BY CLAIMING THIS ROLE YOU AGREE TO RETURN THE ITEMS WHEN REQUESTED OR WHEN LEAVING THE GUILD."
        });

        client.channels.cache.get("883906226872778802").send({ embeds: [finalEmbed] }).then(msg => {
            let reaction_data = JSON.parse(fs.readFileSync("./data/reactions.json"));
            reaction_data.armory.id = msg.id;
            fs.writeFileSync("./data/reactions.json", JSON.stringify(reaction_data));
        });
        return interaction.reply({ content: `The embed has been created.`, ephemeral: true });
    }
}