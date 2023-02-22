const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addkills')
        .setDescription('adds kills to your tally')
        .addStringOption((option) =>
            option
                .setName("kills")
                .setDescription("the amount of kills you would like to add")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        
        let kills = parseInt(interaction.options.getString("kills"));
        if (!Number.isInteger(kills) || kills <= 0) return interaction.reply({ content: "Please provide a valid amount of kills", ephemeral: true })
        
        let merc_data = JSON.parse(fs.readFileSync("./data/merc_data.json"));

        let exists = false;
        let total_kills = 0;
        for (var i = 0; i < merc_data.length; i++) {
            if (merc_data[i].id === interaction.user.id) {
                total_kills = merc_data[i].kills += kills;
                merc_data[i].kills = total_kills;
                exists = true;
            }
        }
        if (!exists) return interaction.reply({ content: "You are not currently enlisted", ephemeral: true })

        fs.writeFileSync("./data/merc_data.json", JSON.stringify(merc_data));
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`<:BB_Check:1031690264089202698> ┊ Successfully added ${kills} kills.\n<:blank:1019977634249187368> ┊ You now have ${total_kills} total kills.`)
            ]
        })
    }
}