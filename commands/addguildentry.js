const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addguildentry")
    .setDescription("adds a new guild object to the config")
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("the id of the guild")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("the name of the guild")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription("the role of the guild")
        .setRequired(true)
    ),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");

    if (!/^[0-9]+$/.test(interaction.options.getString("id")))
      return interaction.reply({
        content: `Please provide a valid Guild ID`,
        ephemeral: true,
      });

    const guild = {
      id: parseInt(interaction.options.getString("id")),
      name: interaction.options.getString("name"),
      role: interaction.options.getString("role").replace(/<|@|&|>/g, ""),
    };

    if (!/^(<@&)?[0-9]+>?$/.test(guild.role))
      return interaction.reply({
        content: `Please provide a valid role or role ID`,
        ephemeral: true,
      });

    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    let hasperms = interaction.member.permissions.has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    config.guilds.push({
      id: guild.id,
      name: guild.name,
      role: guild.role,
    });
    fs.writeFileSync("./data/config.json", JSON.stringify(config));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `<:BB_Check:1031690264089202698> ┊ Successfully added new guild.\n<:blank:1019977634249187368> ┊ Name: ${guild.name}\n<:blank:1019977634249187368> ┊ ID: ${guild.id}\n<:blank:1019977634249187368> ┊ Role: <@&${guild.role}>`
          ),
      ],
    });
  },
};
