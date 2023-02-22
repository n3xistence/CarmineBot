const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enlist')
        .setDescription('enlist a player as a mercenary for the guild')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("mention a user or user id")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
        let user = client.guilds.cache.get(interaction.guild.id).members.cache.get(user_id).user;
        if (!user) return interaction.reply({ content: "Invalid user provided", ephemeral: true })

        let merc_data = JSON.parse(fs.readFileSync("./data/merc_data.json"));

        for (var i = 0; i < merc_data.length; i++) {
            if (merc_data[i].id === user_id) {
                return interaction.reply({ content: "This user is already enlisted.", ephemeral: true });
            }
        }

        merc_data.push({
            "id": user.id,
            "kills": 0
        })
        fs.writeFileSync("./data/merc_data.json", JSON.stringify(merc_data));
        return interaction.reply(`Successfully enlisted ${user}.`);
    }
}