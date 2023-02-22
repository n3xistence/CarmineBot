const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addapikey")
    .setDescription("adds a new API key to the config.")
    .addStringOption((option) =>
      option.setName("key").setDescription("the API key").setRequired(true)
    ),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");
    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    let hasperms = interaction.member.permissions.has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    let key = interaction.options.getString("key");
    if (!/^[0-9a-zA-Z]+$/.test(key))
      return interaction.reply({
        content: `Please provide a valid API Key`,
        ephemeral: true,
      });

    let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
    api_data.push({
      key: key,
      limit: 0,
    });

    fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `<:BB_Check:1031690264089202698> ┊ Successfully added new API Key.`
          ),
      ],
    });
  },
};
