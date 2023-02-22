const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function linkUser(interaction, user_data, smmo_id, helper, db_gen, db_ud) {
  const fs = require("fs");

  let user_data_files = db_ud
    .prepare(`select name from sqlite_master where type='table'`)
    .all()
    .filter((elem) => elem.name.startsWith("ud"));

  if (user_data_files.length > 0) {
    user_data_files = user_data_files
      .map((elem) => elem.name.replace(/\_/g, "-").replace("ud", ""))
      .sort(function (a, b) {
        return (
          new Date(helper.date_to_ISO8601(a)) -
          new Date(helper.date_to_ISO8601(b))
        );
      });
  }

  const config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.roles.guildmember.id === "undefined") return "fatal_error";

  var api_key = getAPI_Key();
  if (!api_key) return "api_error";

  let errors = "";

  //validate the inputs
  if (
    !interaction.options.getString("id") ||
    !Number.isInteger(parseInt(interaction.options.getString("id")))
  )
    return interaction.reply({
      content: "You must provide an ID",
      ephemeral: true,
    });

  //check if the user is already linked or ID is taken
  let user_check = db_gen
    .prepare(`SELECT * FROM links WHERE SMMO_ID=?`)
    .get(smmo_id);
  if (user_check) return "id_assigned";

  let link_check = db_gen
    .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
    .get(interaction.user.id);
  if (link_check) return "id_linked";

  try {
    let cmd = db_gen.prepare(`INSERT INTO links VALUES (?, ?, ?)`);
    cmd.run(interaction.user.id, smmo_id.toString(), 1);
  } catch (e) {
    console.log(e);
    return "fatal_error";
  }

  let linked_since = db_gen
    .prepare(`SELECT * FROM linkedsince WHERE id=?`)
    .get(smmo_id);
  if (!linked_since) {
    let cmd = db_gen.prepare(`INSERT INTO linkedsince VALUES (?, ?)`);
    cmd.run(smmo_id, helper.getToday());
  }

  let payload = [
    user_data.id,
    user_data.name,
    user_data.level,
    user_data.steps,
    user_data.npc_kills,
    user_data.user_kills,
    user_data.quests_performed,
    user_data.tasks_completed,
    user_data.boss_kills,
    user_data.bounties_completed,
    user_data.safeMode,
    user_data.current_location.name,
    user_data.current_location.id,
    user_data.guild.id,
  ];

  //add on-join entry
  try {
    let join_check = db_ud
      .prepare(`SELECT * FROM JoinData WHERE id=?`)
      .get(smmo_id);
    if (!join_check) {
      let cmd = db_ud.prepare(
        `INSERT INTO JoinData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      cmd.run(...payload);
    }
  } catch {
    errors += "*- Join DB Error*\n";
  }

  //add entry to weekly DB
  try {
    let weekly_check = db_ud
      .prepare(`SELECT * FROM UserData WHERE id=?`)
      .get(smmo_id);
    if (!weekly_check) {
      let cmd = db_ud.prepare(
        `INSERT INTO UserData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      cmd.run(...payload);
    }
  } catch {
    errors += "*- Weekly DB Error*\n";
  }

  //add entry to boss DB
  try {
    let boss_check = db_ud
      .prepare(`SELECT * FROM BossUserData WHERE id=?`)
      .get(smmo_id);
    if (!boss_check) {
      let cmd = db_ud.prepare(
        `INSERT INTO BossUserData VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      cmd.run(...payload);
    }
  } catch {
    errors += "*- Boss DB Error*\n";
  }

  if (user_data_files.length > 0) {
    //add entry to yesterday's DB so user can check stats
    let date = user_data_files[user_data_files.length - 1].replace(/\-/g, "_");
    try {
      let yesterday_check = db_ud
        .prepare(`SELECT * FROM ud${date} WHERE id=?`)
        .get(smmo_id);
      if (!yesterday_check) {
        let cmd = db_ud.prepare(
          `INSERT INTO ud${date} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        cmd.run(...payload);
      }
    } catch (e) {
      errors += "*- Fatal Yesterday DB Error*\n";
    }
  }

  //add entry to Live DB so users don't have to wait for sync after linking
  try {
    let live_check = db_ud
      .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
      .get(smmo_id);
    if (!live_check) {
      let cmd = db_ud.prepare(
        `INSERT INTO UserDataLive VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      cmd.run(...payload);
    }
  } catch (e) {
    console.log(e);
    errors += "*- Live DB Error*\n";
  }

  return errors === "" ? "none" : errors;
}

function getAPI_Key() {
  const fs = require("fs");
  let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
  if (api_data[0].limit >= 35) {
    if (api_data[1].limit >= 35) {
      if (api_data[2].limit >= 35) {
        return null;
      } else {
        api_data[2].limit++;
        fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
        return api_data[2].key;
      }
    } else {
      api_data[1].limit++;
      fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
      return api_data[1].key;
    }
  } else {
    api_data[0].limit++;
    fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
    return api_data[0].key;
  }
}

function createVerifyKey() {
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gverify")
    .setDescription("verifies your account")
    .addStringOption((option) =>
      option.setName("id").setDescription("your SMMO id").setRequired(true)
    ),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");
    const axios = require("axios");
    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    if (!config.guilds[0])
      return interaction.reply({
        content: `The Guild config is not set up correctly, please ask a moderator to set it up.`,
        ephemeral: true,
      });
    if (config.server.roles.guildmember.id === "undefined")
      return interaction.reply({
        content: `The Guildmember role is not set up correctly, please ask a moderator to set it up.`,
        ephemeral: true,
      });

    var url = "https://api.simple-mmo.com/v1/player/info/";

    let api_key = getAPI_Key();
    if (!api_key)
      return interaction.reply({
        content: "The API limit has been reached, try again in 1 minute.",
        ephemeral: true,
      });

    let input_id = parseInt(interaction.options.getString("id"));
    if (!Number.isInteger(input_id))
      return interaction.reply({
        content: `Please provide your ingame id.`,
        ephemeral: true,
      });
    let data = JSON.parse(fs.readFileSync("./data/verifications.json"));

    let index = true;
    for (let i = 0; i < data.length; i++) {
      if (data[i].user_id === interaction.user.id) {
        index = i;
        i = data.length;
      }
    }

    if (Number.isInteger(index)) {
      //request API data
      async function getUserData() {
        try {
          return await axios.post(`${url}${input_id}`, { api_key: api_key });
        } catch (err) {
          console.log(
            `[3;33m[x] - error with the SMMO api (code 01_VERIFY_${interaction.user.username})[0m` +
              err
          );
          return null;
        }
      }

      getUserData().then(async (response) => {
        if (response === null)
          return interaction.reply({
            content: "Fatal API error.",
            ephemeral: true,
          });

        let user_data = response.data;

        if (!user_data.guild)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  `[<:BB_Cross:1031690265334911086>] ┊ You are not a member of the guild.\n<:blank:1019977634249187368> ┊ Are you sure [this](https://web.simple-mmo.com/user/view/${input_id}) is you?`
                ),
            ],
            ephemeral: true,
          });

        let is_member = false;
        for (let i = 0; i < config.guilds.length; i++) {
          if (user_data.guild.id == config.guilds[i].id) is_member = true;
        }

        if (!is_member)
          return interaction.reply({
            content: "You are not a member of the guild.",
            ephemeral: true,
          });

        if (!user_data.motto.includes(data[index].verification_key))
          return interaction.reply({
            content: `Your motto does not include your verification key.\nYour current key is: \´${data[index].verification_key}\``,
            ephemeral: true,
          });

        let link_check = linkUser(
          interaction,
          user_data,
          input_id,
          helper,
          db_gen,
          db_ud
        );

        switch (link_check) {
          case "id_linked":
            return interaction.reply({
              content:
                "[<:BB_Cross:1031690265334911086>] You are already linked.",
              ephemeral: true,
            });
          case "id_assigned":
            return interaction.reply({
              content:
                "[<:BB_Cross:1031690265334911086>] This ID is already assigned.",
              ephemeral: true,
            });
          case "api_error":
            return interaction.reply({
              content:
                "[<:BB_Cross:1031690265334911086>] There has been an error with the API, try again in 1 minute.",
              ephemeral: true,
            });
          case "fatal_error":
            return interaction.reply({
              content:
                "[<:BB_Cross:1031690265334911086>] There has been an error. If persitent, please contact `n3xistence#0003`",
              ephemeral: true,
            });
          default:
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("Green")
                  .setDescription(
                    `<:BB_Check:1031690264089202698> ┊ Your account has been verified.\n<:blank:1019977634249187368> ┊ SMMO ID: [${input_id}](https://web.simple-mmo.com/user/view/${input_id})`
                  ),
              ],
            });

            await interaction.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Green")
                  .setDescription(
                    `<:BB_Check:1031690264089202698> ┊ Successfully linked to [${input_id}](https://web.simple-mmo.com/user/view/${input_id}).\n<:blank:1019977634249187368> ┊ Errors: ${
                      link_check
                        ? link_check === "none"
                          ? "none"
                          : `\n${link_check}`
                        : "none"
                    }`
                  ),
              ],
            });
            break;
        }

        //universal role
        var role = client.guilds.cache
          .get(config.server.id)
          .roles.cache.find((r) => r.id === config.server.roles.guildmember.id);
        interaction.member.roles.add(role);

        //guild specific role
        for (let i = 0; i < config.guilds.length; i++) {
          if (user_data.guild.id == config.guilds[i].id) {
            let role = client.guilds.cache
              .get(config.server.id)
              .roles.cache.find((r) => r.id === config.guilds[i].role);
            interaction.member.roles.add(role);
          }
        }

        data.splice(index, 1);
        fs.writeFileSync("./data/verifications.json", JSON.stringify(data));
        return;
      });
    } else {
      let user_check = db_gen
        .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
        .get(interaction.user.id);
      if (user_check)
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `[<:BB_Cross:1031690265334911086>] You are already linked to ${user_check.SMMO_ID}`
              ),
          ],
          ephemeral: true,
        });

      let link_check = db_gen
        .prepare(`SELECT * FROM links WHERE SMMO_ID=?`)
        .get(input_id);
      if (link_check)
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                `[<:BB_Cross:1031690265334911086>] This ID is already assigned to <@${link_check.Discord_ID}>`
              ),
          ],
          ephemeral: true,
        });

      //add user with verification key to DB
      let verification_key = createVerifyKey();
      data.push({
        user_id: interaction.user.id,
        user_link: input_id,
        verification_key: verification_key,
      });
      fs.writeFileSync("./data/verifications.json", JSON.stringify(data));

      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `<:BB_Check:1031690264089202698> ┊ Your verification key is \`${verification_key}\`\n<:blank:1019977634249187368> ┊ Change your [motto](https://web.simple-mmo.com/changemotto) to this key and run the command again (*with* your id).`
            ),
        ],
        ephemeral: true,
      });
    }
  },
};
