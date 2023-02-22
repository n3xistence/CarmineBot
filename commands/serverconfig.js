const {
  SlashCommandBuilder,
  EmbedBuilder,
  ReactionCollector,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverconfig")
    .setDescription("displays the server config"),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");
    const config = JSON.parse(fs.readFileSync("./data/config.json"));

    let sEmbed = new EmbedBuilder()
      .setColor("#2f3136")
      .setThumbnail(client.user.displayAvatarURL(), true)
      .setTitle(`${interaction.guild.name} Server Info`)
      .addFields(
        { name: "**Server Name**", value: `${config.server.name}` },
        { name: "**Server ID**", value: `${config.server.id}` },
        { name: "**Server Owner**", value: `<@${config.server.owner.id}>` },

        {
          name: "**Rolechannel ID**",
          value: `${config.server.channels.roles}\n<#${config.server.channels.roles}>`,
        },
        {
          name: "**Questchannel ID**",
          value: `${config.server.channels.quests}\n<#${config.server.channels.quests}>`,
        },
        {
          name: "**Rankschannel ID**",
          value: `${config.server.channels.ranks}\n<#${config.server.channels.ranks}>`,
        },
        {
          name: "**Ranklogschannel ID**",
          value: `${config.server.channels.ranklogs}\n<#${config.server.channels.ranklogs}>`,
        },
        {
          name: "**Diachannel ID**",
          value: `${config.server.channels.diaalerts}\n<#${config.server.channels.diaalerts}>`,
        },
        {
          name: "**Warchannel ID**",
          value: `${config.server.channels.wars}\n<#${config.server.channels.wars}>`,
        },
        {
          name: "**Focuswarschannel ID**",
          value: `${config.server.channels.focuswars}\n<#${config.server.channels.focuswars}>`,
        },
        {
          name: "**Welcomechannel ID**",
          value: `${config.server.channels.welcome}\n<#${config.server.channels.welcome}>`,
        },
        {
          name: "**Reminderchannel ID**",
          value: `${config.server.channels.reminders}\n<#${config.server.channels.reminders}>`,
        },
        {
          name: "**Raidbosschannel ID**",
          value: `${config.server.channels.raidboss}\n<#${config.server.channels.raidboss}>`,
        },
        {
          name: "**Datachannel ID**",
          value: `${config.server.channels.data}\n<#${config.server.channels.data}>`,
        },
        {
          name: "**Competitionchannel ID**",
          value: `${config.server.channels.competitions}\n<#${config.server.channels.competitions}>`,
        },
        {
          name: "**Eventchannel ID**",
          value: `${config.server.channels.events}\n<#${config.server.channels.events}>`,
        },

        {
          name: "**PVP Elite Role**",
          value: `<@&${config.server.roles.pvpelite.id}>`,
        },
        {
          name: "**Guildmember Role**",
          value: `<@&${config.server.roles.guildmember.id}>`,
        },
        {
          name: "**Moderator Role**",
          value: `<@&${config.server.roles.moderator.id}>`,
        },
        {
          name: "**Quests Role**",
          value: `<@&${config.server.roles.quests.id}>`,
        },
        {
          name: "**Diamondping Role**",
          value: `<@&${config.server.roles.diapings.id}>`,
        },
        {
          name: "**Giveawayping Role**",
          value: `<@&${config.server.roles.giveaways.id}>`,
        },
        {
          name: "**Level Roles**",
          value: `<@&${config.server.roles.levels.r_100k}>\n<@&${config.server.roles.levels.r_50k}>\n<@&${config.server.roles.levels.r_10k}>\n<@&${config.server.roles.levels.r_5k}>\n<@&${config.server.roles.levels.r_1k}>\n<@&${config.server.roles.levels.r_below1k}>\n`,
        }
      );
    return interaction.reply({ embeds: [sEmbed] });
  },
};
