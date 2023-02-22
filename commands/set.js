const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set")
    .setDescription("sets the id of the channel to handle the raid bosses in")

    .addSubcommandGroup((SubcommandGroup) =>
      SubcommandGroup.setName("channel")
        .setDescription("set a channel for the config")

        .addSubcommand((subcommand) =>
          subcommand
            .setName("raidboss")
            .setDescription("set the raidboss channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("competitions")
            .setDescription("set the competition channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("data")
            .setDescription("set the data channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("diaalerts")
            .setDescription("set the diamond ping channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("focuswars")
            .setDescription("set the focuswar channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("quests")
            .setDescription("set the quest channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ranklogs")
            .setDescription("set the ranklogs channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ranks")
            .setDescription("set the ranks channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reminders")
            .setDescription("set the reminder channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("roles")
            .setDescription("set the roles channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("wars")
            .setDescription("set the war channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("welcome")
            .setDescription("set the welcome channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("events")
            .setDescription("set the event channel for the config")
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The Channel")
            )
        )
    )
    .addSubcommandGroup((SubcommandGroup) =>
      SubcommandGroup.setName("role")
        .setDescription("set a role for the config")

        .addSubcommand((subcommand) =>
          subcommand
            .setName("diapings")
            .setDescription("set the diamond ping role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("guildmember")
            .setDescription("set the guild member role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("moderator")
            .setDescription("set the moderator role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("pvpelite")
            .setDescription("set the pvp elite role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("quests")
            .setDescription("set the quest ping role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("giveaways")
            .setDescription("set the giveaway ping role for the config")
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("moerequest")
            .setDescription(
              "set the role to ping when a new MoE request is placed"
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("worshiprequests")
            .setDescription(
              "set the role to ping when a new worship request is placed"
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("The Role")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("levels")
            .setDescription("set the level roles")
            .addStringOption((option) =>
              option
                .setName("roles")
                .setDescription("The Role IDs (comma separated)")
            )
        )
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

    const type = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    if (!type || !subcommand)
      return interaction.reply({
        content: `Please Specify a Type`,
        ephemeral: true,
      });

    if (type === "channel") {
      let channel = interaction.options.getChannel("channel");
      if (!channel)
        return interaction.reply({
          content: `Invalid Channel.`,
          ephemeral: true,
        });

      for (const [key, value] of Object.entries(config.server.channels)) {
        if (subcommand !== key) continue;

        config.server.channels[key] = channel.id;
        fs.writeFileSync(
          "./data/config.json",
          JSON.stringify(config, null, "\t")
        );
        return interaction.reply({
          content: `Set ${subcommand} channel to <#${channel.id}>.`,
          ephemeral: true,
        });
      }
    } else if (type === "role") {
      if (subcommand === "levels") {
        let ids = interaction.options.getString("roles").split(",");
        if (ids.length !== 6)
          return interaction.reply({
            content: `Please provide an id for all 6 roles.\n>>> >100k\n>50k\n>10k\n>5k\n>1k\n<1k\n`,
          });

        for (let i = 0; i < ids.length; i++) {
          let role = await interaction.guild.roles.cache.get(
            ids[i].replace(" ", "")
          );
          if (!role)
            return interaction.reply({
              content: `There was an error fetching role <@&${ids[i]}>. No roles have been set.`,
            });

          switch (i) {
            case 0:
              config.server.roles.levels.r_100k = role.id;
              break;
            case 1:
              config.server.roles.levels.r_50k = role.id;
              break;
            case 2:
              config.server.roles.levels.r_10k = role.id;
              break;
            case 3:
              config.server.roles.levels.r_5k = role.id;
              break;
            case 4:
              config.server.roles.levels.r_1k = role.id;
              break;
            case 5:
              config.server.roles.levels.r_below1k = role.id;
              break;
            default:
              console.log("default");
              i = ids.length;
              break;
          }
        }
        fs.writeFileSync(
          "./data/config.json",
          JSON.stringify(config, null, "\t")
        );

        return interaction.reply({
          content: `Successfully set all level roles.`,
        });
      } else {
        let role = interaction.options.getRole("role");
        if (!role)
          return interaction.reply({
            content: `Invalid Role.`,
            ephemeral: true,
          });

        for (const [key, value] of Object.entries(config.server.roles)) {
          if (subcommand !== key) continue;

          config.server.roles[key].id = role.id;
          config.server.roles[key].name = role.name;
          fs.writeFileSync(
            "./data/config.json",
            JSON.stringify(config, null, "\t")
          );
          return interaction.reply({
            content: `Set ${subcommand} role to <@&${role.id}>.`,
            ephemeral: true,
          });
        }
      }
    }
  },
};
