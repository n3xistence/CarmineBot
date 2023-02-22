const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("unlinks your account"),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");

    let config = JSON.parse(fs.readFileSync("./data/config.json"));

    let user = interaction.user;
    let member = interaction.member;

    //get user link
    let link = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(user.id);
    if (!link)
      return interaction.reply({
        content: "You are not linked.",
        ephemeral: true,
      });

    db_gen.prepare(`DELETE FROM links WHERE SMMO_ID=?`).run(link.SMMO_ID);

    //universal role
    var role = interaction.guild.roles.cache.find(
      (r) => r.id === config.server.roles.guildmember.id
    );
    member.roles.remove(role);

    //guild specific role
    for (let i = 0; i < config.guilds.length; i++) {
      let role = interaction.guild.roles.cache.find(
        (r) => r.id === config.guilds[i].role
      );
      member.roles.remove(role);
    }

    return interaction.reply({
      content: "Successfully unlinked your account.",
      ephemeral: true,
    });
  },
};
