const { SlashCommandBuilder, GuildInviteManager } = require("discord.js");

const createDBSchema = (new_db_gen, new_db_ud) => {
  new_db_gen.transaction(() => {
    new_db_gen
      .prepare(
        `CREATE TABLE wars(guild_1_id INT,guild_1_name VARCHAR(10),guild_1_kills INT,guild_2_kills INT,guild_2_name VARCHAR(10),guild_2_id INT,status VARCHAR(10),message_id VARCHAR(10));`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE targets(member_id VARCHAR(10),target_id VARCHAR(10));`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE weeklycheck(id VARCHAR(10),q_1 INT,q_2 INT,q_3 INT,q_4 INT,q_5 INT);`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE quests(id INT,raw_data INT,type VARCHAR(10),description VARCHAR(10),msg_id VARCHAR(10),completion INT);`
      )
      .run();

    new_db_gen
      .prepare(
        `CREATE TABLE points(id VARCHAR(10),user VARCHAR(10),points INT);`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE mee6levels(id VARCHAR(10),name VARCHAR(10),level INT);`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE links(Discord_ID VARCHAR(10),SMMO_ID VARCHAR(10),SM_Ping INT);`
      )
      .run();
    new_db_gen
      .prepare(`CREATE TABLE endedwars(id INT,name VARCHAR(10),timestamp INT);`)
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE EventData(id INT, type VARCHAR(10), value INT, description VARCHAR(10), has_completed BIT, balance INT);`
      )
      .run();
    new_db_gen
      .prepare(
        `CREATE TABLE giveaways(id INT, owner VARCHAR(10), type VARCHAR(10), time VARCHAR(10), winners INT, active INT);`
      )
      .run();
    new_db_gen
      .prepare(`CREATE TABLE linkedsince(id int,date varchar(10));`)
      .run();
  })();
  new_db_gen.close();

  new_db_ud.transaction(() => {
    new_db_ud
      .prepare(
        `CREATE TABLE UserDataLive(id INT,name VARCHAR(10),level INT,steps INT,npc INT,pvp INT,quests INT,tasks INT,bosses INT,bounties INT,safemode INT,location_name VARCHAR(10),location_id INT,guild_id INT);`
      )
      .run();
    new_db_ud
      .prepare(
        `CREATE TABLE JoinData(id INT,name VARCHAR(10),level INT,steps INT,npc INT,pvp INT,quests INT,tasks INT,bosses INT,bounties INT,safemode INT,location_name VARCHAR(10),location_id INT, guild_id INT);`
      )
      .run();
    new_db_ud
      .prepare(
        `CREATE TABLE UserData(id INT, name TEXT, level INT, steps INT, npc INT, pvp INT, quests INT, tasks INT, bosses INT, bounties INT, safemode INT, location_name TEXT, location_id INT, guild_id INT);`
      )
      .run();
    new_db_ud
      .prepare(
        `CREATE TABLE BossUserData(id INT, name TEXT, level INT, steps INT, npc INT, pvp INT, quests INT, tasks INT, bosses INT, bounties INT, safemode INT, location_name TEXT, location_id INT, guild_id INT);`
      )
      .run();
  });
  new_db_ud.close();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("initializeguild")
    .setDescription("sets up the server config for the first time"),
  async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
    const fs = require("fs");

    let guild_id = interaction.guild.id;
    let guild_name = interaction.guild.name;
    let owner = await interaction.guild.fetchOwner();

    if (!guild_id || !guild_name)
      return interaction.reply({
        content: "There was an error setting up the config.",
        ephemeral: true,
      });

    if (
      !interaction.user.id === "189764769312407552" &&
      !interaction.user.id === owner.id
    )
      return interaction.reply({
        content: "Incorrect authorisation.",
        ephemeral: true,
      });

    if (!fs.existsSync("./data")) fs.mkdirSync("./data");

    let config = {
      server: {
        id: guild_id,
        name: guild_name,
        owner: {
          name: owner.user.username,
          id: owner.id,
        },
        channels: {
          ranks: "undefined",
          ranklogs: "undefined",
          roles: "undefined",
          quests: "undefined",
          welcome: "undefined",
          diaalerts: "undefined",
          wars: "undefined",
          focuswars: "undefined",
          raidboss: "undefined",
          reminders: "undefined",
          data: "undefined",
          events: "undefined",
          competitions: "undefined",
        },
        roles: {
          guildmember: {
            name: "undefined",
            id: "undefined",
          },
          pvpelite: {
            name: "undefined",
            id: "undefined",
          },
          moderator: {
            name: "undefined",
            id: "undefined",
          },
          quests: {
            name: "undefined",
            id: "undefined",
          },
          diapings: {
            name: "undefined",
            id: "undefined",
          },
          giveaways: {
            name: "undefined",
            id: "undefined",
          },
          moerequests: {
            name: "undefined",
            id: "undefined",
          },
          worshiprequests: {
            name: "undefined",
            id: "undefined",
          },
          levels: {
            r_100k: "undefined",
            r_50k: "undefined",
            r_10k: "undefined",
            r_5k: "undefined",
            r_1k: "undefined",
            r_below1k: "undefined",
          },
        },
      },
      guilds: [],
    };
    fs.writeFileSync("./data/config.json", JSON.stringify(config, null, "\t"));

    let giveaways = {
      current: [],
      past: [],
    };
    fs.writeFileSync(
      "./data/giveaways.json",
      JSON.stringify(giveaways, null, "\t")
    );

    let requests = { worship: [], moes: [] };
    fs.writeFileSync(
      "./data/requests.json",
      JSON.stringify(requests, null, "\t")
    );

    fs.writeFileSync("./data/api_data.json", JSON.stringify([], null, "\t"));
    fs.writeFileSync("./data/focuswars.json", JSON.stringify([], null, "\t"));
    fs.writeFileSync("./data/boss_LB.json", JSON.stringify([], null, "\t"));
    fs.writeFileSync(
      "./data/competitions.json",
      JSON.stringify([], null, "\t")
    );
    fs.writeFileSync("./data/merc_data.json", JSON.stringify([], null, "\t"));
    fs.writeFileSync(
      "./data/verifications.json",
      JSON.stringify([], null, "\t")
    );

    fs.writeFileSync(
      "./data/attackable_guildies.json",
      JSON.stringify({}, null, "\t")
    );
    fs.writeFileSync("./data/boss_data.json", JSON.stringify({}, null, "\t"));
    fs.writeFileSync("./data/dia_data.json", JSON.stringify({}, null, "\t"));
    fs.writeFileSync("./data/diaPrice.json", JSON.stringify({}, null, "\t"));
    fs.writeFileSync(
      "./data/guild_war_status.json",
      JSON.stringify({}, null, "\t")
    );
    fs.writeFileSync("./data/queue.json", JSON.stringify({}, null, "\t"));

    fs.writeFileSync("./data/data.db", "");
    fs.writeFileSync("./data/userdata.db", "");

    const new_db_gen = require("better-sqlite3")("./data/data.db");
    const new_db_ud = require("better-sqlite3")("./data/userdata.db");
    new_db_gen.pragma("journal_mode = WAL");
    new_db_ud.pragma("journal_mode = WAL");

    try {
      createDBSchema(new_db_gen, new_db_ud);
    } catch (e) {
      console.log(e);
      return interaction.reply({
        content: `This guild has already been initialized. Please contact n3xistence#0003 for help.`,
        ephemeral: true,
      });
    }

    return interaction.reply(
      `Set server id to ${guild_id}.\nSet server name to ${guild_name}\n\n__[!] You may now edit the config.__\n__[!] Type /set to see the options you have.__`
    );
  },
};
