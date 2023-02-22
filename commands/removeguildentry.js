const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeguildentry')
        .setDescription('removes a new guild object from the config')
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("the id of the guild")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("the name of the guild")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        const guild = {
            "id": parseInt(interaction.options.getString("id")),
            "name": interaction.options.getString("name")
        }

        if (!guild.id && !guild.name) return interaction.reply({ content: `You need to provide which guild you want to remove.`, ephemeral: true });

        if (guild.id){
            if (!Number.isInteger(guild.id)) return interaction.reply({ content: `Please provide a valid Guild ID`, ephemeral: true });
        }

        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        for (let i = 0; i < config.guilds.length; i++) {
            if (config.guilds[i].id == guild.id || config.guilds[i].name == guild.name) {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(`<:BB_Check:1031690264089202698> ┊ Successfully removed guild.\n<:blank:1019977634249187368> ┊ Name: ${config.guilds[i].name}\n<:blank:1019977634249187368> ┊ ID: ${config.guilds[i].id}\n<:blank:1019977634249187368> ┊ Role: <@&${guild.id}>`)
                    ]
                })
                config.guilds.splice(i, 1);
                fs.writeFileSync("./data/config.json", JSON.stringify(config));
                return;
            }
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`<:BB_Cross:1031690265334911086> ┊ Error removing Guild Entry:\n<:blank:1019977634249187368> ┊ Could not find entry.`)
            ]
        })
    }
}