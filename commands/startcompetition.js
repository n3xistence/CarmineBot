const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageEmbed,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startcompetition")
    .setDescription("starts a new competition")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("the type of competition you would like to hold")
        .setRequired(true)
        .addChoices(
          { name: "npc", value: "npc" },
          { name: "pvp", value: "pvp" },
          { name: "steps", value: "steps" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "the duration of the competition in days (default 7 days)"
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription(
          "the title of the competition (default '<pvp/npc> competition')"
        )
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription(
          "the role that can access the competition (default is all roles)"
        )
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "the channel to send the embed in (default is the specified competitions channel)"
        )
        .setRequired(false)
    ),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");
    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    if (config.server.roles.moderator.id === "undefined")
      return interaction.reply({
        content:
          "The Moderator role is not set up correctly.\nUse /set role moderator to set it up.",
        ephemeral: true,
      });

    let hasperms = interaction.member.permissions.has("ManageGuild");
    if (!hasperms && interaction.user.id !== "189764769312407552")
      return interaction.reply({
        content: `Invalid authorisation`,
        ephemeral: true,
      });

    let channel = interaction.options.getChannel("channel");
    if (!channel) {
      if (config.server.channels.competitions === "undefined")
        return interaction.reply({
          content:
            "The competition channel is not set up correctly.\nUse /setcompetitionchannel to set it up.",
          ephemeral: true,
        });

      channel = client.channels.cache.get(config.server.channels.competitions);
    }

    let role = interaction.options.getRole("role");
    if (!role) role = "none";

    let embed = new EmbedBuilder();
    let type = interaction.options.getString("type");
    let title = interaction.options.getString("title");
    if (!title) title = `${type} competition`;
    switch (type) {
      case "npc":
        embed
          .setColor("Green")
          .setTitle(`<:BB_NPC:1027227605650391102> ┊ ${title}`);
        break;
      case "pvp":
        embed
          .setColor("Red")
          .setTitle(`<:BB_PVP:1027227607034515456> ┊ ${title}`);
        break;
      case "steps":
        embed
          .setColor("Orange")
          .setTitle(`<:BB_Steps:1027227609723047966> ┊ ${title}`);
        break;
      default:
        return interaction.reply({
          content: "Invalid competition type.",
          ephemeral: true,
        });
    }

    let time = interaction.options.getString("duration");
    let times = time
      .split(/[0-9]+/)
      .filter((e) => e !== undefined && e !== "")
      .map((e) => e.replace(" ", ""));

    let nums = time
      .split(/(\s)|days|day|d|minutes|minute|min|m|hours|hour|h|weeks|week|w/)
      .filter((e) => e !== undefined && e !== "" && e !== " ")
      .map((e) => parseInt(e));

    if (nums.length !== times.length)
      interaction.reply({
        content:
          "Could not parse your time input. Accepted:\n<m/min/minutes/h/hours/d/days/w/weeks>\n\nFormat:```12d14h13min```\n```1day 6h 7minutes```",
        ephemeral: true,
      });

    time = 0;
    for (let i = 0; i < times.length; i++) {
      if (times[i] === "m" || times[i] === "min" || times[i] === "minutes") {
        time += 60 * nums[i];
      } else if (times[i] === "h" || times[i] === "hours") {
        time += 3600 * nums[i];
      } else if (
        times[i] === "d" ||
        times[i] === "days" ||
        times[i] === "day"
      ) {
        time += 86400 * nums[i];
      } else if (times[i] === "w" || times[i] === "weeks") {
        time += 604800 * nums[i];
      } else {
        return interaction.reply({
          content:
            "Could not parse your time input. Accepted:\n<m/min/minutes/h/hours/d/days/w/weeks>\n\nFormat:```12d14h13min```\n```1day 6h 7minutes```",
          ephemeral: true,
        });
      }
    }

    let stamp = parseInt(helper.getUNIXStamp(helper.getToday()));
    stamp += time;
    let daysAhead = Math.floor(time / 86400);

    let comp_data = JSON.parse(fs.readFileSync("./data/competitions.json"));

    let index = comp_data.length;
    let data = {
      index: index,
      database: `CompUserData_${index}`,
      role: role,
      msg: {
        channel: 0,
        id: 0,
      },
      start: {
        date: `${helper.getToday()}`,
        stamp: helper.getUNIXStamp(),
      },
      end: {
        date:
          daysAhead > 0
            ? helper.getFutureDate(helper.getToday(), daysAhead)
            : helper.getToday(),
        stamp: stamp,
      },
      type: type,
      members: [],
    };

    db_ud.prepare(`DROP TABLE IF EXISTS ${data.database}`).run();
    db_ud
      .prepare(
        `CREATE TABLE ${data.database} AS SELECT * FROM UserDataLive WHERE 1=1`
      )
      .run();

    embed
      .setDescription(
        `Started: <t:${data.start.stamp}:R>\nEnding: <t:${data.end.stamp}:R>\nRole restriction: ${role}`
      )
      .addFields({ name: "Top 5:", value: "none" })
      .setFooter({ text: `Participants: ${data.members.length}` });

    let row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("join_competition")
          .setStyle(ButtonStyle.Primary)
          .setLabel("Join")
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("check_competition_stats")
          .setStyle(ButtonStyle.Primary)
          .setLabel("Stats")
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("end_competition")
          .setStyle(ButtonStyle.Success)
          .setEmoji("<:BB_Check:1031690264089202698>")
      );

    await channel.send({ embeds: [embed], components: [row] }).then((msg) => {
      data.msg.id = msg.id;
      data.msg.channel = msg.channel.id;

      comp_data.push(data);
      fs.writeFileSync(
        `./data/competitions.json`,
        JSON.stringify(comp_data, null, "\t")
      );
    });
    return interaction.reply({
      content: `Successfully created new competition of type ${type} in ${channel}.`,
      ephemeral: true,
    });

    /*
            there would be an embed in a channel
            lets just take steps
            you click on button to join
            and then the embed updates to continually show the top 5 steppers
            and then at the end of the set interval
            bot spits out a final lb
            and we payout?
            and when we do payout it notifies those in the discord somewhere (if possible)
            by clicking a button underneath the final lb embed
            and once clicked
            the button disappears
            so we know its been paid out
            also would need a button for those not on lb to to get a disappearing message how many steps has been tracked by bot
            and the embed should include when the next reset is
        */

    /*
            create JSON: 
            {
                "start": [date of the start, to use for DB calls]
                "timestamp": [time when the leaderboards close]
                "type": <NPC/PVP>
                "member": [
                    [all participating members]
                ]
            }

            cron job:
            5min interval
            grabs user DB data
            sort highest gains -> lowest gains

            buttons: 
            1.  opt in  ->  adds member to list (ephemeral response)
            2.  check   ->  checks user progress (ephemeral response)
            3.  end     ->  usable by moderators(config), clickable once
                            (pops up confirmation, ephemeral)
                            removes all buttons
        */

    //this command will create a new embed, needs a type
  },
};
