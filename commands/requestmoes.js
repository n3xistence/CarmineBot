const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("requestmoes")
    .setDescription("adds your request to the list"),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");
    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    let user = interaction.user;

    let requests = JSON.parse(fs.readFileSync("./data/requests.json"));

    let link = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(user.id);
    if (!link)
      return interaction.reply({
        content:
          "Account is not linked. Run `/gverify [yourSMMOid]` to link your account.",
        ephemeral: true,
      });

    try {
      var data_now = db_ud
        .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
        .get(link.SMMO_ID);
    } catch (e) {
      console.log(e);
      return interaction.reply({
        content: "There has been an issue with the database.",
        ephemeral: true,
      });
    }
    if (!data_now)
      return interaction.reply({
        content: "You have no Database entry.",
        ephemeral: true,
      });

    //get data
    let data = db_gen.prepare(`SELECT * FROM points WHERE id=?`).get(user.id);
    if (!data)
      return interaction.reply({
        content: `You do not own any points. Requesting costs 1 point.`,
        ephemeral: true,
      });
    let points = data.points;

    for (var i = 0; i < requests.moes.length; i++) {
      if (requests.moes[i].id === user.id) {
        return interaction.reply({
          content: "You already have a pending request.",
          ephemeral: true,
        });
      }
    }

    if (points < 1)
      return interaction.reply({
        content: "You do not have enough points.",
        ephemeral: true,
      });

    let new_points = points - 1;

    let cmd = db_gen.prepare(`UPDATE points SET points = ? WHERE id = ?`);
    cmd.run(new_points, user.id);

    requests.moes.push({
      id: user.id,
      link: link.SMMO_ID,
    });
    fs.writeFileSync("./data/requests.json", JSON.stringify(requests));
    return interaction.reply({
      content: config.server.roles.moerequests
        ? `<@&${config.server.roles.moerequests}>`
        : "",
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `[<:BB_Check:1031690264089202698>] ${user}, Successfully placed your request.`
          ),
      ],
    });
  },
};
