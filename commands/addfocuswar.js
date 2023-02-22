const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addfocuswar')
        .setDescription('adds a guild to the focus wars')
        .addStringOption((option) =>
            option
                .setName("guildid")
                .setDescription("the ID of the guild")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");
        
        let guildID = interaction.options.getString("guildid");

        const config = JSON.parse(fs.readFileSync("./data/config.json"))
        const war_data = JSON.parse(fs.readFileSync("./data/focuswars.json"))

        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        war_data.push({
            "id": guildID,
            "msg_id": "undefined"
        })
        fs.writeFileSync("./data/focuswars.json", JSON.stringify(war_data));

        return interaction.reply({ content: `Guild ID \`${guildID}\` added to focuswars.`, ephemeral: true })
    }
}