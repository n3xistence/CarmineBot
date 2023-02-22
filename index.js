//requirements
const { Routes } = require("discord-api-types/v10");
const helper = require("./ext/helper/helper.js");
const { REST } = require("@discordjs/rest");
const mee6 = require("mee6-levels-api");
const Discord = require("discord.js");
const cron = require("node-cron");
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  ChannelType,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require("discord.js");

const version = "1.0.0";

const client = new Client({
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

//load databases
let db_gen, db_ud;
try {
  db_gen = require("better-sqlite3")("./data/data.db");
  db_ud = require("better-sqlite3")("./data/userdata.db");
  db_gen.pragma("journal_mode = WAL");
  db_ud.pragma("journal_mode = WAL");
} catch {
  console.log("DB could not be loaded.");
}

setInterval(() => {
  try {
    if (!db_gen) {
      db_gen = require("better-sqlite3")("./data/data.db");
      db_gen.pragma("journal_mode = WAL");
    }
    if (!db_ud) {
      db_ud = require("better-sqlite3")("./data/userdata.db");
      db_ud.pragma("journal_mode = WAL");
    }
  } catch {
    console.log("DB could not be loaded.");
  }
}, 60000);

const token = process.env.TOKEN;

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

//slash commands
const commands = [];
client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(token);

client.on("ready", () => {
  client.user.setPresence({
    activities: [{ name: `with his enemies`, type: ActivityType.Playing }],
  });

  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
    console.log(`v.${version} - Online`);
  })();
});

client.on("guildMemberAdd", (guildMember) => {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (guildMember.guild.id !== config.server.id) return;
  if (config.server.channels.welcome === "undefined")
    return console.log("Config is missing Welcome Channel.");

  const file = new AttachmentBuilder("./welcome.jpg");
  let embed = new EmbedBuilder()
    .setColor("Aqua")
    .setImage("attachment://welcome.jpg")
    .setDescription(
      `Please use a bot channel and run \`/gverify\` to be granted the guild member role`
    );

  client.channels.cache.get(config.server.channels.welcome).send({
    content: `Welcome ${guildMember}, to the Midnight Rain Discord!`,
    embeds: [embed],
    files: [file],
  });
});

//function to get random array element
function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}
//end of random array element

//functon to check if string starts with string
String.prototype.startsWith = function (query) {
  if (this.charAt(0) != query.charAt(0) || query.length > this.length) {
    return false;
  } else {
    for (var i = 0; i < this.length; i++) {
      if (this.charAt(i) != query.charAt(i)) {
        return false;
      }
      if (i + 1 >= query.length) i = this.length;
    }
    return true;
  }
};
//end of string beginng check

//define function to provide a valid api key
function getAPI_Key() {
  let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
  if (
    api_data[0].limit >= 35 &&
    api_data[1].limit >= 35 &&
    api_data[2].limit >= 35
  )
    return null;

  let pick = randomPick(api_data);
  for (let i = 0; i < api_data.length; i++) {
    if (api_data[i].key !== pick.key) continue;

    if (api_data[i].limit > 35) {
      pick = getAPI_Key();
      i--;
    }
  }
  fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));

  return pick.key;
}
//end of api key function

//function to get timestamp
function getTimeStamp() {
  var currentdate = new Date();
  var datetime = `${currentdate.getDate()}/${
    currentdate.getMonth() + 1
  }/${currentdate.getFullYear()} @ ${
    currentdate.getHours() >= 10
      ? currentdate.getHours()
      : `0${currentdate.getHours()}`
  }:${
    currentdate.getMinutes() >= 10
      ? currentdate.getMinutes()
      : `0${currentdate.getMinutes()}`
  }`;
  return datetime;
}
//end of timestamp function

//function to (re-)spawn raidboss
function spawnRaidBoss() {
  if (!fs.existsSync("./data/config.json"))
    return console.log("Config not initialized.");

  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.raidboss === "undefined")
    return console.log(
      "The Raidoss Channel is not set up correctly.\nUse /setbosschannel to set it up."
    );

  let channel = client.channels.cache.get(config.server.channels.raidboss);
  if (!channel)
    return console.log(
      "There has been an error fetching the raidboss channel."
    );

  fs.writeFileSync("./data/boss_LB.json", JSON.stringify([]));

  //drop current boss table
  db_ud.prepare(`DROP TABLE IF EXISTS BossUserData`).run();

  //pick a name for the boss
  let first_names = ["Ar", "Do", "Du", "Zeh", "Brohk", "Ak", "Neh", "Rhak"];
  let last_names = ["Khal", "Sai", "Mah", "Ven", "Sha", "Stren", "Var", "Nhol"];
  let boss_name = `${randomPick(first_names)}'${randomPick(last_names)}`;

  //pick the boss HP
  let link_data = db_gen.prepare(`SELECT * FROM links`).all();
  let min_hp = 4500 * link_data.length;
  let max_hp = 5000 * link_data.length;
  let hp = Math.floor(Math.random() * (max_hp - min_hp) + min_hp);

  let HP_bar = "";
  var z = (hp / hp) * 100;

  //create the progress bar
  for (var i = 0; i < 100; i += 10) {
    if (z - 10 >= 0) {
      HP_bar += "▰";
      z -= 10;
    } else {
      HP_bar += "▱";
      hip;
    }
  }

  let embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(boss_name)
    .setThumbnail(
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI"
    )
    .setFields({
      name: "HP:",
      value: `${hp} / ${hp}\n${HP_bar}`,
    });

  let row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("attack_boss")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔪"),
    new ButtonBuilder()
      .setCustomId("check_boss_dmg")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔍")
  );

  channel
    .send({ embeds: [embed], components: [row] })
    .then((msg) => {
      //copy the current stats to new table
      const cmd = db_ud.prepare(
        `CREATE TABLE BossUserData AS SELECT * FROM UserDataLive WHERE 1 = 1`
      );
      cmd.run();

      let data = {
        name: boss_name,
        hp: hp,
        max_hp: hp,
        id: msg.id,
      };
      fs.writeFileSync("./data/boss_data.json", JSON.stringify(data));
    })
    .catch((e) => {
      console.log(e);
    });
}
//end of raidboss spawn

//function to apply boss damage once per hour
async function autoBossDmg() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  let boss = JSON.parse(fs.readFileSync("./data/boss_data.json"));
  if (!boss.hp) return;

  let boss_channel = config.server.channels.raidboss;
  boss_channel = client.channels.cache.get(boss_channel);

  let msg = await boss_channel.messages.fetch(boss.id).catch(console.log);

  let hp = parseInt(boss.hp);
  let link_list = db_gen.prepare(`SELECT * FROM links`).all();
  for (let i = 0; i < link_list.length; i++) {
    let userID = link_list[i].Discord_ID;
    let link_data = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(userID);
    if (!link_data) continue;
    let link = link_data.SMMO_ID;

    try {
      var data_then = db_ud
        .prepare(`SELECT * FROM BossUserData WHERE id=?`)
        .get(link);
    } catch (e) {
      continue;
    }

    try {
      var data_now = db_ud
        .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
        .get(link);
    } catch (e) {
      continue;
    }
    if (!data_then || !data_now) continue;

    //got user data
    let steps = parseInt(data_now.steps) - parseInt(data_then.steps);
    let NPC = parseInt(data_now.npc) - parseInt(data_then.npc);
    let PVP = parseInt(data_now.pvp) - parseInt(data_then.pvp);
    let quests = parseInt(data_now.quests) - parseInt(data_then.quests);

    let damage = Math.floor(
      5000 *
        (1 -
          Math.pow(
            Math.E,
            -(1 / 4500) *
              (steps * (1 + (0.15 * NPC + 0.2 * PVP + 0.1 * quests)))
          ))
    );
    if (damage <= 0) continue;

    let leaderboards = JSON.parse(fs.readFileSync("./data/boss_LB.json"));
    let exists = false;
    for (let j = 0; j < leaderboards.length; j++) {
      if (leaderboards[j].id === userID) {
        leaderboards[j].damage = parseInt(leaderboards[j].damage) + damage;
        exists = true;
        j = leaderboards.length;
      }
    }
    if (!exists) {
      leaderboards.push({
        id: userID,
        damage: damage,
      });
    }
    fs.writeFileSync("./data/boss_LB.json", JSON.stringify(leaderboards));

    hp = parseInt(hp) - damage;
    //on death
    if (hp <= 0) {
      let endEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(boss.name)
        .setThumbnail(
          "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI"
        )
        .setFields({
          name: "HP:",
          value: `[<:BB_Cross:1031690265334911086>] DEAD`,
        });

      let leaderboards = JSON.parse(fs.readFileSync("./data/boss_LB.json"));

      //display the leaderboards
      let LB_string = "";
      function sortFunction(a, b) {
        if (a.damage === b.damage) return 0;
        else return a.damage > b.damage ? -1 : 1;
      }

      let overall_damage = 0;
      for (let j = 0; j < leaderboards.length; j++) {
        overall_damage += parseInt(leaderboards[j].damage);
      }

      leaderboards.sort(sortFunction);

      //add rewards
      for (let j = 0; j < 5; j++) {
        if (!leaderboards[j]) continue;

        switch (j + 1) {
          case 1:
            var reward = 5;
            break;
          case 2:
            var reward = 4;
            break;
          case 3:
            var reward = 3;
            break;
          case 4:
            var reward = 2;
            break;
          case 5:
            var reward = 1;
            break;
          default:
            continue;
        }

        let current_points = db_gen
          .prepare(`SELECT * FROM points WHERE id=?`)
          .get(leaderboards[i].id);

        if (current_points) {
          let new_points = current_points.points + reward;

          let cmd = db_gen.prepare(`UPDATE points SET points = ? WHERE id = ?`);
          try {
            cmd.run(new_points, leaderboards[i].id);
          } catch {
            data_channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(`Red`)
                  .setDescription(
                    `<:BB_Cross:1031690265334911086> There was an error adding ${reward} points to <@${leaderboards[i].id}>`
                  ),
              ],
            });
          }
        } else {
          let user = await client.users.fetch(leaderboards[i].id);
          if (!user) {
            data_channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(`Red`)
                  .setDescription(
                    `<:BB_Cross:1031690265334911086> Error retrieving <@${leaderboards[i].id}>. Could not add ${reward} points.`
                  ),
              ],
            });
          } else {
            try {
              let cmd = db_gen.prepare(`INSERT INTO points VALUES (?, ?, ?)`);
              cmd.run(user.id, user.username, reward);
            } catch {
              data_channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(`Red`)
                    .setDescription(
                      `<:BB_Cross:1031690265334911086> There was an error adding ${reward} points to <@${leaderboards[i].id}>`
                    ),
                ],
              });
            }
          }
        }
      }

      //create lb string (top 5)
      for (let j = 0; j < 5; j++) {
        if (!leaderboards[j]) continue;
        LB_string += `${j + 1}. <@${leaderboards[j].id}> - ${
          leaderboards[j].damage
        } dmg (${((leaderboards[j].damage / overall_damage).toFixed(3) * 100)
          .toString()
          .substring(0, 4)}%)\n`;
      }

      //send the victory embed
      let data_channel = client.channels.cache.get(config.server.channels.data);
      if (LB_string.length > 4096) {
        data_channel.send(
          `__**${boss.name} has been vanquished!**__\n${LB_string}`
        );
      } else {
        let LB_embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle(`${boss.name} has been vanquished!`)
          .setDescription(LB_string);
        data_channel.send({ embeds: [LB_embed] });
      }

      //clear the boss data
      delete boss.name;
      delete boss.hp;
      delete boss.max_hp;
      delete boss.id;
      fs.writeFileSync("./data/boss_data.json", JSON.stringify(boss));

      //edit the boss embed
      return await msg
        .edit({ embeds: [endEmbed], components: [] })
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 3600000);

          //spawn new boss after interval
          setTimeout(() => {
            spawnRaidBoss();
          }, 86400000); //12h
        })
        .catch((e) => {
          console.log(e);
        });
    }

    let data = {
      name: boss.name,
      hp: hp,
      max_hp: boss.max_hp,
      id: msg.id,
    };
    fs.writeFileSync("./data/boss_data.json", JSON.stringify(data));

    let cmd = db_ud.prepare(
      `UPDATE BossUserData SET steps=?, npc=?, pvp=?, quests=? WHERE id=?`
    );
    cmd.run(data_now.steps, data_now.npc, data_now.pvp, data_now.quests, link);
  }

  let HP_bar = "";
  var z = (hp / boss.max_hp) * 100;

  //create the progress bar
  for (var j = 0; j < 100; j += 10) {
    if (z - 10 >= 0) {
      HP_bar += "▰";
      z -= 10;
    } else {
      HP_bar += "▱";
    }
  }

  let newEmbed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(boss.name)
    .setThumbnail(
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI"
    )
    .setFields({
      name: "HP:",
      value: `${hp} / ${boss.max_hp}\n${HP_bar}`,
    });
  await msg.edit({ embeds: [newEmbed] });
}
//end of raidboss auto dmg function

//function to invert a string
String.prototype.invertString = function () {
  if (this.length === 0) return;
  let string = "";
  for (let i = this.length - 1; i >= 0; i--) {
    string += this[i];
  }
  return string;
};
//end of string inverse

//function to display a number with decimal separators
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
//end of decimal separator function

//function to round to the nearest number divisible by 10
function roundToNearest10(num) {
  return Math.round(num / 10) * 10;
}
//end of round function

//function to create competitive progressbar
function createCompetingProgressbar(val1, val2) {
  if (val1 === 0 && val2 === 0) return "▰▰▰▰▰▱▱▱▱▱";

  let sum = val1 + val2;
  let ratio1 = val1 / sum;
  let ratio2 = val2 / sum;

  let progressBar = "";
  let z = roundToNearest10(ratio1 * 100);
  for (var i = 0; i < 100; i += 10) {
    if (z - 10 >= 0) {
      progressBar += "▰";
      z -= 10;
    } else i = 100;
  }

  z = roundToNearest10(ratio2 * 100);
  for (var i = 0; i < 100; i += 10) {
    if (z - 10 >= 0) {
      progressBar += "▱";
      z -= 10;
    } else i = 100;
  }
  return progressBar;
}
//end of comp progress bar

//cron function definition
//define quest purge
async function purgeQuestEmbeds() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.quests === undefined)
    return console.log("Config is missing Quests Channel.");

  //getting the address
  let channel = client.channels.cache.get(config.server.channels.quests);
  if (!channel) return;

  let msg_list = await channel.messages.fetch();

  let quest_data = db_gen.prepare(`SELECT * FROM quests`).all();
  for (let i = 0; i < quest_data.length; i++) {
    msg_list.forEach((msg) => {
      if (msg.id != quest_data[i].msg_id) return;

      msg.delete().catch(console.log);
    });
  }
}
//end of quest purge definition

//function to check for users' all time stats for ranks
function getAlltimeUserData(userID) {
  //data to be returned
  var userData = [];

  //get user link
  try {
    var link_data = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(userID);
  } catch {
    return "error";
  }
  if (!link_data) return "error";
  else var link = link_data.SMMO_ID;

  //get user data
  try {
    var data_then = db_ud
      .prepare(`SELECT steps,npc,pvp FROM JoinData WHERE id=?`)
      .get(link);
  } catch {
    return "error";
  }
  if (!data_then) return "error";

  try {
    var data_now = db_ud
      .prepare(`SELECT steps,npc,pvp FROM UserDataLive WHERE id=?`)
      .get(link);
  } catch {
    return "error";
  }
  if (!data_now) return "error";

  //calculate difference
  var total_steps = data_now.steps - data_then.steps;
  var total_NPC = data_now.npc - data_then.npc;
  var total_PVP = data_now.pvp - data_then.pvp;
  userData.push(total_steps, total_NPC, total_PVP);

  //return user data
  return userData;
}
//end of alltime stats check

//function to create new quests
function createQuests() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.quests === "undefined")
    return console.log("Config is missing Quests Channel.");

  //possible quests, [0] = type, [1] = description
  const quest_levels = ["levels", "gain", 250, 500, 750];
  const quest_steps = ["steps", "take", 2000, 3000, 4000];
  const quest_npc = ["NPCs", "kill", 500, 1000, 1500];
  const quest_pvp = ["players", "kill", 500, 750, 1000];
  const quest_quests = ["quests", "complete", 500, 750, 1000];
  const quest_tasks = ["tasks", "complete", 10, 20, 30];
  const quest_bosses = ["bosses", "kill", 4, 6, 8];
  const quest_bounties = ["bounties", "complete", 5, 10, 15];

  //create array of all quests
  const quests_list = [
    quest_steps,
    quest_levels,
    quest_quests,
    quest_npc,
    quest_pvp,
    quest_tasks,
    quest_bosses,
    quest_bounties,
  ];

  async function createQuest() {
    //fill quest indices
    var quest_picks = [];
    for (var i = 0; i < 5; i++) {
      var roll = Math.floor(Math.random() * quests_list.length);
      if (!quest_picks.includes(roll)) {
        quest_picks[i] = roll;
      } else {
        while (true) {
          roll = Math.floor(Math.random() * quests_list.length);
          if (!quest_picks.includes(roll)) {
            quest_picks[i] = roll;
            break;
          }
        }
      }
    }

    //pick quests from quest list
    for (var i = 0; i < 5; i++) {
      //preparing embed
      var roll = Math.floor(Math.random() * (quests_list[i].length - 2)) + 2;
      var quest_Type = quests_list[quest_picks[i]][0];
      var quest_Value = quests_list[quest_picks[i]][roll];
      var quest_Desctiption = `${
        quests_list[quest_picks[i]][1]
      } ${quest_Value} ${quest_Type}`;

      switch (quest_Type) {
        case "players":
          quest_Type = "PVP";
          break;
        case "bosses":
          quest_Type = "boss";
          break;
        case "bounties":
          quest_Type = "bounty";
          break;
        default:
          break;
      }

      let finalEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setThumbnail(client.user.displayAvatarURL(), true)
        .setTitle(`**Quest #${i + 1}**`)
        .setFooter({ text: `Completed by 0 users.` })
        .addFields({
          name: "**Description**",
          value: `${quest_Desctiption}`,
          inline: true,
        })
        .setTimestamp();

      let row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`quest_${i + 1}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji("<:BB_Check:1031690264089202698>")
      );
      await client.channels.cache
        .get(config.server.channels.quests)
        .send({ embeds: [finalEmbed], components: [row] })
        .then((msg) => {
          let cmd = db_gen.prepare(
            `UPDATE quests SET raw_data=?, type=?, description=?, msg_id=?, completion=? WHERE id=?`
          );
          cmd.run(quest_Value, quest_Type, quest_Desctiption, msg.id, 0, i + 1);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }
  createQuest();
}
//end of quest creation

//function to edit PvP elite role based on PvP kills achieved in the past week
async function pvpEliteRole() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.roles.pvpelite === "undefined")
    return console.log("Config is missing PVP Elite Role.");

  const pvpCheckValue = 500;

  const pvpRoleID = config.server.roles.pvpelite.id;
  let guild = client.guilds.cache.get(config.server.id);
  const pvp_role = guild.roles.cache.find((r) => r.id === pvpRoleID);

  //removing user pvp roles
  pvp_role.members.map((member) => {
    member.roles.remove(pvp_role);
  });

  let members = await guild.members.fetch();

  members.forEach((member) => {
    //get user link
    let link_data = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(member.id);
    if (!link_data) return;
    let link = link_data.SMMO_ID;

    //get user data
    let data_then = db_ud
      .prepare(`SELECT pvp FROM UserData WHERE id=?`)
      .get(link);
    let data_now = db_ud
      .prepare(`SELECT pvp FROM UserDataLive WHERE id=?`)
      .get(link);
    if (!data_then || !data_now) return;

    if (data_now.pvp - data_then.pvp >= pvpCheckValue) {
      member.roles.add(pvp_role);
    }
  });
  console.log("successfully edited PvP role.");
}
//end of pvp role definiton

//function to check giveaways
setInterval(async function () {
  if (!fs.existsSync("./data/config.json"))
    return console.log("Config not initialized.");
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  let giveaway_list = JSON.parse(fs.readFileSync("./data/giveaways.json"));
  if (!giveaway_list.current[0]) return;

  for (let i = 0; i < giveaway_list.current.length; i++) {
    let giveaway_data = db_gen
      .prepare(`SELECT * FROM giveaways WHERE id=?`)
      .get(giveaway_list.current[i].index);
    if (!giveaway_data) continue;
    if (helper.getUNIXStamp() < giveaway_data.time || giveaway_data.active == 0)
      continue;

    let winners = [];
    let userlist = giveaway_list.current[i].users;
    let amount = userlist.length;
    for (let j = 0; j < giveaway_data.winners; j++) {
      if (!userlist[0]) continue;

      let pick = randomPick(userlist);
      userlist.splice(userlist.indexOf(pick), 1);
      winners.push(pick);
    }

    let winnerlist = "";
    let ping = "";
    for (let j = 0; j < winners.length; j++) {
      if (!winners[j]) continue;

      ping += `<@${winners[j].id}>, `;
      winnerlist += `${j + 1}. <@${
        winners[j].id
      }> - [[Profile]](https://simplemmo.me/mobile/?page=user/view/${
        winners[j].link
      })\n`;
    }

    let channel = await client.channels.fetch(
      giveaway_list.current[i].msg.channel
    );
    if (!channel) continue;
    let msg = await channel.messages.fetch(giveaway_list.current[i].msg.id);
    if (!msg) continue;
    await msg
      .edit({
        embeds: [
          new EmbedBuilder()
            .setTitle(msg.embeds[0].data.title)
            .setColor(msg.embeds[0].data.color)
            .setDescription(
              msg.embeds[0].data.description.replace("Ends", "Ended")
            )
            .setFooter({ text: `${amount} participants` }),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`reroll_giveaway`)
              .setStyle(ButtonStyle.Primary)
              .setLabel("Reroll")
          ),
        ],
      })
      .catch((e) => {
        console.log(e);
      });

    if (winnerlist !== "") {
      channel.send({
        content: `Congratulations to ${ping.slice(0, -2)}!`,
        embeds: [
          new EmbedBuilder()
            .setTitle(`🎊 GIVEAWAY #${giveaway_list.current[i].index} ENDED 🎊`)
            .setColor("#e76f51")
            .setDescription(
              `\uFEFF\n**Prize: ${giveaway_data.type}**\n\n**Winners:**\n${winnerlist}`
            ),
        ],
      });
      let owner = await client.users.fetch(giveaway_list.current[i].owner);
      if (!owner)
        return console.log(`No owner found for giveaway ${giveaway_data.type}`);
      try {
        await owner.send({
          content: `**🎁 YOUR GIVEAWAY HAS ENDED 🎁**`,
          embeds: [
            new EmbedBuilder()
              .setColor("#e9c46a")
              .setDescription(
                `**Prize: \`${giveaway_data.type}\`**\n\nYou can access your giveaway [here](https://discord.com/channels/${config.server.id}/${giveaway_list.current[i].msg.channel}/${giveaway_list.current[i].msg.id}).`
              ),
          ],
        });
      } catch {
        console.log(`Could not notify ${owner.username} about ended giveaway.`);
      }
    }

    let cmd = db_gen.prepare(`UPDATE giveaways SET active=0 WHERE id=?`);
    cmd.run(giveaway_data.id);

    giveaway_list.past.push(giveaway_list.current[i]);
    giveaway_list.current.splice(i, 1);
    fs.writeFileSync(
      "./data/giveaways.json",
      JSON.stringify(giveaway_list, null, "\t")
    );
  }
}, 5000);
//end of giveaway function

//function to confirm the userdata has been updated
function confirmUserSync() {
  let user_data = db_ud
    .prepare(`select name from sqlite_master where type='table'`)
    .all()
    .filter((elem) => elem.name.startsWith("ud"))
    .map((elem) => elem.name.replace(/\_/g, "-").replace("ud", ""));

  user_data.sort(function (a, b) {
    return (
      new Date(helper.date_to_ISO8601(a)) - new Date(helper.date_to_ISO8601(b))
    );
  });

  if (user_data.includes(helper.getYesterday()))
    return console.log("User Sync has already been performed successfully.");

  console.log("Confirming User Sync...");
  syncDBYesterday();
}
//end of daily sync safeguard

//function to refresh competition data
setInterval(async function () {
  if (!fs.existsSync("./data/competitions.json"))
    return console.log("Competitions not initialized.");
  let comp_data = JSON.parse(fs.readFileSync("./data/competitions.json"));

  for (let j = 0; j < comp_data.length; j++) {
    if (helper.getUNIXStamp() > comp_data[j].end.stamp) continue;

    let user_list = [];
    for (let i = 0; i < comp_data[j].members.length; i++) {
      let link_data = db_gen
        .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
        .get(comp_data[j].members[i].id);
      if (!link_data) continue;
      let link = link_data.SMMO_ID;

      let data_then = db_ud
        .prepare(`SELECT * FROM ${comp_data[j].database} WHERE id=?`)
        .get(link);
      let data_now = db_ud
        .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
        .get(link);
      if (!data_now || !data_then) continue;

      let progress = 0;
      switch (comp_data[j].type) {
        case "npc":
          progress = data_now.npc - data_then.npc;
          break;
        case "pvp":
          progress = data_now.pvp - data_then.pvp;
          break;
        case "steps":
          progress = data_now.steps - data_then.steps;
          break;
        default:
          continue;
      }
      user_list.push([comp_data[j].members[i].id, link, progress]);
    }
    function sortFunction(a, b) {
      if (a[2] === b[2]) return 0;
      else return a[2] > b[2] ? -1 : 1;
    }
    user_list.sort(sortFunction);

    let data_string = "";
    for (let k = 0; k < 5; k++) {
      if (!user_list[k]) continue;
      else
        data_string += `${k + 1}. <@${user_list[k][0]}> ┊ ${user_list[k][2]} ${
          comp_data[j].type
        } ${comp_data[j].type === "steps" ? "" : "kills"}\n`;
    }
    if (!data_string) return;

    let channel = await client.channels.fetch(comp_data[j].msg.channel);
    if (!channel) continue;

    let msg = await channel.messages.fetch(comp_data[j].msg.id);
    if (!msg) continue;

    await msg.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle(msg.embeds[0].data.title)
          .setColor(msg.embeds[0].data.color)
          .setDescription(msg.embeds[0].data.description)
          .addFields({ name: "Top 5:", value: data_string })
          .setFooter({ text: `Participants: ${comp_data[j].members.length}` }),
      ],
    });
  }
}, 15000);

//define weekly reset to reset completed quests
function weeklyReset() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.quests === "undefined")
    return console.log("Config is missing Quests Channel.");
  db_gen.prepare(`DELETE FROM WeeklyCheck WHERE 1=1`).run();

  db_ud.prepare(`DROP TABLE IF EXISTS UserData`).run();
  db_ud
    .prepare(`CREATE TABLE UserData AS SELECT * FROM UserDataLive WHERE 1=1`)
    .run();

  client.channels.cache
    .get(config.server.channels.quests)
    .send(`<@&${config.server.roles.quests.id}>\n[!] New weekly quests!`)
    .then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 3600000);
    });
}

//function to award players with bonus points if they completed all quests
async function completeAll() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.quests === "undefined")
    return console.log("Config is missing Quests Channel.");

  //prepare the final embed
  let finalEmbed = new EmbedBuilder()
    .setColor("#2f3136")
    .setThumbnail(client.user.displayAvatarURL(), true)
    .setTitle("Users who have completed all weekly quests:");

  const guild = client.guilds.cache.get(GUILD_ID);
  await guild.members.fetch();

  guild.members.cache.forEach((member) => {
    let wc = db_gen
      .prepare(`SELECT * FROM weeklycheck WHERE id=?`)
      .get(member.id);
    if (!wc) return;

    if (
      wc.q_1 === 1 &&
      wc.q_2 === 1 &&
      wc.q_3 === 1 &&
      wc.q_4 === 1 &&
      wc.q_5 === 1
    ) {
      try {
        var link = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(member.id);
      } catch {
        return;
      }

      var current_points = db_gen
        .prepare(`SELECT * FROM points WHERE id=?`)
        .get(member.id);
      let new_points = current_points.points + 2;

      let cmd = db_gen.prepare(`UPDATE points SET points=? WHERE id = ?`);
      cmd.run(new_points, member.id);

      finalEmbed.addFields({
        name: member.user.username + ":",
        value: "New balance: " + new_points,
      });
    }
  });
  client.channels.cache
    .get(config.server.channels.quests)
    .send({ embeds: [finalEmbed] })
    .then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 3600000);
    });
}

function syncDBYesterday() {
  function getYesterday(today) {
    let day = `${today[0]}${today[1]}`;
    let month = `${today[3]}${today[4]}`;
    let year = `${today[6]}${today[7]}${today[8]}${today[9]}`;

    if (day > 1) {
      return `${`${
        parseInt(day) - 1 >= 10 ? parseInt(day) - 1 : `0${parseInt(day) - 1}`
      }`.slice(-2)}${today.slice(2)}`;
    } else {
      if (month == 1) {
        return `31-12-${parseInt(year) - 1}`;
      } else if (month == 03) {
        if (year % 4 == 0) {
          return `29-0${month - 1}${today.slice(5)}`;
        } else {
          return `28-0${month - 1}${today.slice(5)}`;
        }
      } else if (
        month == 05 ||
        month == 07 ||
        month == 08 ||
        month == 10 ||
        month == 12
      ) {
        return `30-${month - 1 < 10 ? `0${month - 1}` : month - 1}${today.slice(
          5
        )}`;
      } else {
        return `31-${month - 1 < 10 ? `0${month - 1}` : month - 1}${today.slice(
          5
        )}`;
      }
    }
  }

  function getToday() {
    let date = new Date();

    let day = `0${date.getDate()}`.slice(-2);
    let month = `0${date.getMonth() + 1}`.slice(-2);
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  try {
    let filename = getYesterday(getToday()).replace(/\-/g, "_");
    const cmd = db_ud.prepare(
      `CREATE TABLE ud${filename} AS SELECT * FROM UserDataLive WHERE 1 = 1`
    );
    let res = cmd.run();
    console.log("Successfully synced daily DB");
  } catch (e) {
    console.log(e);
    console.log("Error syncing daily DB");
  }
}
//end of cron function definition

//cron handling
cron.schedule(
  "0-15 * * * *",
  () => {
    checkEndingWars();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "00 * * * *",
  () => {
    autoBossDmg();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "20 * * * *",
  () => {
    syncHoldingWars();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "30 * * * *",
  () => {
    syncActiveWars();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "58 11 * * 1",
  () => {
    pvpEliteRole();
    completeAll();
    purgeQuestEmbeds();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "59 11 * * 1",
  () => {
    weeklyReset();
    createQuests();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "00 12 * * *",
  () => {
    syncDBYesterday();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "0-5 12 * * *",
  () => {
    confirmUserSync();
  },
  {
    timezone: "Europe/London",
  }
);

cron.schedule(
  "00 00 28 * *",
  () => {
    let config = JSON.parse(fs.readFileSync("./data/config.json"));
    if (config.server.channels.reminders === "undefined")
      return console.log("Condfig is missing Reminders Channel.");
    let channel = client.channels.cache.get(config.server.channels.diaalerts);

    let reminderEmbed = new EmbedBuilder()
      .setColor("#2f3136")
      .setThumbnail(client.user.displayAvatarURL(), true)
      .setTitle("[❗] Reminder")
      .setDescription("This is your reminder to open your monthly chest!");
    if (channel) channel.send({ embeds: [reminderEmbed] });
  },
  {
    timezone: "Europe/London",
  }
);
//end of cron handling

//reset the api limit every minute to prevent overuse of api key
setInterval(function () {
  if (!fs.existsSync("./data/api_data.json"))
    return console.log("API Key file not initialized.");

  let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
  for (var i = 0; i < api_data.length; i++) {
    api_data[i].limit = 1;
  }
  fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
}, 60000);

//sync user discord Level
setInterval(() => {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.roles.guildmember.id === "undefined")
    return console.log("Condfig is missing Guildmember Role.");
  const list = client.guilds.cache.get(GUILD_ID);

  async function syncData() {
    list.members.cache.forEach((member) => {
      if (
        !member.roles.cache.find(
          (r) => r.id === config.server.roles.guildmember.id
        )
      )
        return;

      try {
        mee6
          .getUserXp(GUILD_ID, member.user.id)
          .then((user) => {
            if (!user) return;

            //stage user data
            let userID = member.user.id;
            let userName = member.user.username;
            let userLevel = user.level;

            let level_entry = db_gen
              .prepare(`SELECT * FROM mee6levels WHERE id=?`)
              .get(user.id);

            if (level_entry) {
              let cmd = db_gen.prepare(
                `UPDATE mee6levels SET level=? WHERE id=?`
              );
              cmd.run(user.level, user.id);
            } else {
              let cmd = db_gen.prepare(
                `INSERT INTO mee6levels VALUES (?, ?, ?)`
              );
              cmd.run(userID, userName, userLevel);
            }
          })
          .catch(console.log);
      } catch (e) {
        console.log("\x1B[3;33m[x] - error with the mee6 api (code 01)\x1B[0m");
        console.log(e);
      }
    });
  }
  try {
    syncData().then(() => {
      var today = new Date();
      var time =
        (parseInt(today.getHours()) < 10
          ? "0" + today.getHours()
          : today.getHours()) +
        ":" +
        (parseInt(today.getMinutes()) < 10
          ? "0" + today.getMinutes()
          : today.getMinutes());
      console.log(time + " - updated user discord levels.");
    });
  } catch {
    console.log("\x1B[3;33m[x] - error with the mee6 api (code 02)\x1B[0m");
  }
}, 3600000);
//end of discord sync

//Check the diamond market every minute to see if there are cheap diamonds available
setInterval(function () {
  let fs = require("fs");
  if (!fs.existsSync("./data/competitions.json"))
    return console.log("Competitions not initialized.");

  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.diaalerts === "undefined")
    return console.log("Config is missing DiaAlert Channel.");
  if (config.server.roles.diapings.id === "undefined")
    return console.log("Config is missing Diaping Role.");

  var url = "https://api.simple-mmo.com/v1/diamond-market";
  var api_key = getAPI_Key();

  let diaData = JSON.parse(fs.readFileSync("./data/dia_data.json"));
  if (api_key != null) {
    try {
      async function getUserData() {
        try {
          return await axios.post(url, { api_key: api_key });
        } catch (err) {
          console.log(
            "\x1B[3;33m[x] - error with the SMMO api (code 01_DIA)\x1B[0m\n" +
              err
          );
          return null;
        }
      }

      var priceList = [];
      getUserData().then((response) => {
        if (response === null) return;

        response.data.forEach((listing) => {
          priceList.push([
            listing.price_per_diamond,
            listing.diamonds_remaining,
            listing.seller.id,
          ]);
        });
        if (!priceList[0]) return;
        let smallest = priceList[0][0];
        let amount = priceList[0][1];
        let seller = priceList[0][2];
        for (var i = 0; i < priceList.length; i++) {
          if (priceList[i][0] < smallest) {
            smallest = priceList[i][0];
            amount = priceList[i][1];
            seller = priceList[i][2];
          }
        }

        if (diaData.current_listing.seller == seller) return;

        if (smallest <= diaData.price) {
          if (!diaData.current_listing.seller) {
            let finalEmbed = new EmbedBuilder()
              .setColor("#2f3136")
              .setTitle("**Diamond alert**")
              .setURL("https://web.simple-mmo.com/diamond-market?new_page=true")
              .setThumbnail(
                "https://web.simple-mmo.com/img/icons/I_Diamond.png"
              )
              .setDescription(
                `${numberWithCommas(
                  amount
                )} Diamonds on the market for ${numberWithCommas(
                  smallest
                )}<:smmoGoldIcon:923398928454520862>`
              );

            client.channels.cache
              .get(config.server.channels.diaalerts)
              .send({
                content: `<@&${config.server.roles.diapings.id}>`,
                embeds: [finalEmbed],
              })
              .then((msg) => {
                let data = {
                  price: diaData.price,
                  current_listing: {
                    price: smallest,
                    seller: seller,
                    id: msg.id,
                  },
                };
                fs.writeFileSync("./data/dia_data.json", JSON.stringify(data));
              });
          }
        } else {
          if (!diaData.current_listing.seller) return;

          (async () => {
            let dia_channel = client.channels.cache.get(
              config.server.channels.diaalerts
            );
            if (dia_channel) {
              let msg = await dia_channel.messages
                .fetch(diaData.current_listing.id)
                .catch(console.log);

              if (msg) {
                let endEmbed = new EmbedBuilder()
                  .setColor("#2f3136")
                  .setTitle("**Diamond alert**")
                  .setURL(
                    "https://web.simple-mmo.com/diamond-market?new_page=true"
                  )
                  .setThumbnail(
                    "https://web.simple-mmo.com/img/icons/I_Diamond.png"
                  )
                  .setDescription(`[x] ENDED`);
                msg.edit({ embeds: [endEmbed] });
              }
              let data = {
                price: diaData.price,
                seller: seller,
                current_listing: {},
              };
              fs.writeFileSync("./data/dia_data.json", JSON.stringify(data));
            }
          })();
        }
      });
    } catch {
      console.log(
        "\x1B[3;33m[x] - error while checking the diamond market\x1B[0m"
      );
    }
  }
}, 20000);
//end of diamond market alert

//syncing SMMO to live stats
setInterval(function () {
  async function syncUserData() {
    let userlist = [];
    const link_list = db_gen
      .prepare(`SELECT Discord_ID, SMMO_ID, SM_Ping FROM links`)
      .all();
    for (let i = 0; i < link_list.length; i++) {
      let user_data = db_ud
        .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
        .get(link_list[i].SMMO_ID);
      if (user_data) {
        userlist.push([
          user_data.id,
          user_data.name,
          user_data.level,
          user_data.steps,
          user_data.npc,
          user_data.pvp,
          user_data.quests,
          user_data.tasks,
          user_data.bosses,
          user_data.bounties,
          user_data.safemode,
          user_data.location_name,
          user_data.location_id,
          link_list[i].Discord_ID,
          link_list[i].SM_Ping,
        ]);
      } else {
        userlist.push([
          link_list[i].SMMO_ID,
          "0",
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          "0",
          0,
          link_list[i].Discord_ID,
          link_list[i].SM_Ping,
        ]);
      }
    }

    let timeout = 3500;
    userlist.forEach(function (user, index) {
      setTimeout(() => {
        let url = `https://api.simple-mmo.com/v1/player/info/${user[0]}`;

        let api_key = getAPI_Key();
        if (api_key === null) {
        } else {
          async function getUserData() {
            try {
              return await axios.post(url, { api_key: api_key });
            } catch (err) {
              console.log(
                "\x1B[3;33m[x] - error with the SMMO api (code 01_USERS_LIVE)\x1B[0m\n" +
                  err
              );
              console.log("code: " + err.code);
              let api_data = JSON.parse(
                fs.readFileSync("./data/api_data.json")
              );

              for (let i = 0; i < api_data.length; i++) {
                if (api_data[i].key === api_key) {
                  console.log(`${api_key} - limit: ${api_data[i].limit}`);
                }
              }
              return null;
            }
          }

          getUserData().then((response) => {
            if (response === null) return;
            var user_data = response.data;

            let user_entry = db_ud
              .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
              .get(user[0]);

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
              user_data.guild ? user_data.guild.id : 0,
            ];

            if (!user_entry) {
              user.splice(-2, 2);
              let cmd = db_ud.prepare(
                `INSERT INTO UserDataLive VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              );
              cmd.run(...payload);
            } else {
              if (user[10] == 1 && user_data.safeMode == 0 && user[14] == 1) {
                let userGold = 0;
                if (user_data.gold >= 1000) {
                  if (parseFloat(user_data.gold) >= 1000000) {
                    if (parseFloat(user_data.gold) >= 1000000000) {
                      userGold = (user_data.gold / 1000000000).toFixed(2);
                      userGold += "b";
                    } else {
                      userGold = (user_data.gold / 1000000).toFixed(2);
                      userGold += "m";
                    }
                  } else {
                    userGold = (user_data.gold / 1000).toFixed(2);
                    userGold += "k";
                  }
                }

                client.users.fetch(user[13]).then((user) => {
                  let noticeEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Your safemode has expired!")
                    .setDescription(`Gold in pocket: ${userGold} `);
                  user.send({ embeds: [noticeEmbed] }).catch(console.log);
                });
              }

              user.splice(-2, 2);
              //update entry
              let cmd = db_ud.prepare(
                `UPDATE UserDataLive SET id=?, name=?, level=?, steps=?, npc=?, pvp=?, quests=?, tasks=?, bosses=?, bounties=?, safemode=?, location_name=?, location_id=?, guild_id=? WHERE id=?`
              );
              let res = cmd.run(...payload, user[0]);
            }
          });
        }
      }, timeout * index);
    });
  }

  //call the user sync function
  syncUserData().then(() => {
    var today = new Date();
    var time =
      (parseInt(today.getHours()) < 10
        ? "0" + today.getHours()
        : today.getHours()) +
      ":" +
      (parseInt(today.getMinutes()) < 10
        ? "0" + today.getMinutes()
        : today.getMinutes());
    console.log(time + " - updated SMMO stats.");
  });
}, 600000);
//end of SMMO data update

//focus war sync
setInterval(function () {
  const config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.focuswars === "undefined")
    return console.log("Config is missing Focuswar Channel.");
  const warlist = JSON.parse(fs.readFileSync("./data/focuswars.json"));

  if (!warlist[0]) return;

  warlist.forEach(async (war) => {
    let guildID = war.id;
    const url = `https://api.simple-mmo.com/v1/guilds/members/${guildID}`;

    let guildnameurl = `https://api.simple-mmo.com/v1/guilds/info/${guildID}`;
    var api_key = getAPI_Key();
    if (api_key != null) {
      var guilddata = await axios.post(guildnameurl, { api_key: api_key });
      guilddata = guilddata.data;
    }

    var api_key = getAPI_Key();
    if (api_key != null) {
      async function getUserData() {
        try {
          return await axios.post(url, { api_key: api_key });
        } catch (err) {
          console.log(
            "\x1B[3;33m[x] - error with the SMMO api (code 01_WARS_FC)\x1B[0m\n" +
              err
          );
          return null;
        }
      }

      var userList = [];

      getUserData().then(async (response) => {
        if (response === null) return;
        if (!response.data[0]) return;

        var user_data = response.data;
        user_data.forEach((gMember) => {
          userList.push([
            gMember.name,
            gMember.user_id,
            gMember.last_activity,
            gMember.safe_mode,
            gMember.level,
            gMember.current_hp,
            gMember.max_hp,
          ]);
        });

        let safemodeusers = [];
        for (var k = 0; k < userList.length; k++) {
          if (userList[k][3] == 0) {
            safemodeusers.push(userList[k]);
          }
        }

        if (userList[0] != undefined) {
          function sortFunction(a, b) {
            if (a[4] === b[4]) {
              return 0;
            } else {
              return a[4] > b[4] ? -1 : 1;
            }
          }
          userList.sort(sortFunction);

          var userListString = [];
          let stringcounter = 0;
          for (var k = 0; k < userList.length; k++) {
            if (!userListString[stringcounter])
              userListString[stringcounter] = "";
            if (userListString[stringcounter].length < 3800) {
              if (userList[k][3] == 0) {
                let userHP = `${(
                  (userList[k][5] / userList[k][6]).toFixed(3) * 100
                )
                  .toString()
                  .substring(0, 4)}%`;
                userListString[
                  stringcounter
                ] += `[[${userList[k][0]}]](https://simplemmo.me/mobile/?page=user/attack/${userList[k][1]}) - LVL ${userList[k][4]} - HP: ${userHP}\n`;
              }
            } else {
              stringcounter++;
              k--;
            }
          }

          var embeds = [];
          for (var i = 0; i < userListString.length; i++) {
            var embed = new EmbedBuilder()
              .setColor(guilddata.eligible_for_guild_war ? "Green" : "Blue")
              .setURL(
                `https://simplemmo.me/mobile/?page=guilds/view/${guildID}/members?attackable=1&new_page=true`
              )
              .setThumbnail(
                `https://web.simple-mmo.com/img/icons/${guilddata.icon}`
              )
              .setTitle(`**[${guildID}] ${guilddata.name}**`)
              .setDescription(
                `*Updated every 5 minutes.*\nAmount: ${safemodeusers.length}\n\n${userListString[i]}`
              );
            embeds.push(embed);
          }

          let channel = client.channels.cache.get(
            config.server.channels.focuswars
          );
          if (war.msg_id !== "undefined") {
            let message = await channel.messages
              .fetch(war.msg_id)
              .catch((e) => {
                return channel.send({ embeds: [embed] }).then((msg) => {
                  war.msg_id = msg.id;
                  fs.writeFileSync(
                    "./data/focuswars.json",
                    JSON.stringify(warlist)
                  );
                });
              });
            if (message) {
              message.edit({ embeds: [embed] }).catch((e) => {
                console.log(e);
              });
            }
          } else {
            await channel.send({ embeds: [embed] }).then((msg) => {
              war.msg_id = msg.id;
              fs.writeFileSync(
                "./data/focuswars.json",
                JSON.stringify(warlist)
              );
            });
          }
        }
      });
    } else {
      interaction.editReply(
        "the API limit has been reached, try again in 60s."
      );
    }
  });
}, 300000); //5min
//end of focus war sync

//check if any wars can be re-delcared
setInterval(async function () {
  let fs = require("fs");
  if (!fs.existsSync("./data/config.json"))
    return console.log("Config not initialized.");

  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.wars === "undefined")
    return console.log("The Wars Channel is not set up correctly.");

  let h48 = 172800;

  let war_channel = client.channels.cache.get(config.server.channels.wars);
  if (!war_channel) return console.log("War Channel Error: No such channel.");
  let entry = db_gen.prepare(`SELECT * FROM endedwars`).all();

  for (let i = 0; i < entry.length; i++) {
    if (Math.floor(Math.floor(Date.now() / 1000)) - entry[i].timestamp > h48) {
      await war_channel.send({
        content: `<@&${config.server.roles.moderator.id}>`,
        embeds: [
          new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
              `[💀] War can now be declared on [${entry[i].name}](https://simplemmo.me/mobile/?page=guilds/view/${entry[i].id})!`
            ),
        ],
      });
      let cmd = db_gen.prepare(`DELETE FROM endedwars WHERE id=?`);
      cmd.run(entry[i].id);
    }
  }
}, 60000);
//end of redeclare check

//sync holding wars
function syncHoldingWars() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (!config.guilds[0]) return console.log("Config is missing Guild ID.");
  if (config.server.channels.wars === "undefined")
    return console.log("Config is missing Wars Channel.");

  async function getWarData() {
    let url = `https://api.simple-mmo.com/v1/guilds/wars/${config.guilds[0].id}/3`;
    let api_key = getAPI_Key();

    if (api_key == null) return;
    try {
      var response = await axios.post(url, { api_key: api_key });
    } catch (err) {
      console.log(
        "\x1B[3;33m[x] - error with the SMMO api (code 01_WARS_HLD)\x1B[0m\n" +
          err
      );
      return null;
    }
    if (response === null || !response) return;

    let warList = response.data;

    //check if guild is not eligible for wars
    api_key = getAPI_Key();
    url = `https://api.simple-mmo.com/v1/guilds/info/${config.guilds[0].id}`;
    async function getGuildState() {
      try {
        return await axios.post(url, { api_key: api_key });
      } catch (err) {
        console.log(
          "\x1B[3;33m[x] - error with the SMMO api (code 01)\x1B[0m\n" + err
        );
        return null;
      }
    }
    getGuildState().then(async (response) => {
      if (response === null || !response) return;

      let war_status = JSON.parse(
        fs.readFileSync("./data/guild_war_status.json")
      );
      if (
        !response.data.eligible_for_guild_war &&
        war_status.status != "hold"
      ) {
        let war_channel = client.channels.cache.get(
          config.server.channels.wars
        );
        let old_message = await war_channel.messages.fetch(war_status.msg_id);
        await old_message.delete().catch(console.log);

        let hold_embed = new EmbedBuilder()
          .setColor("Blue")
          .setDescription(
            `[⏸] All wars have been put on hold\n*Use \`/guildattackcheck\` to check your war status.*`
          );

        return war_channel.send({ embeds: [hold_embed] }).then((msg) => {
          let data = {
            status: "hold",
            message_id: msg.id,
          };
          fs.writeFileSync(
            "./data/guild_war_status.json",
            JSON.stringify(data)
          );
        });
      } else if (
        response.data.eligible_for_guild_war &&
        war_status.status == "hold"
      ) {
        let war_channel = client.channels.cache.get(
          config.server.channels.wars
        );
        let old_message = await war_channel.messages.fetch(war_status.msg_id);
        await old_message.delete().catch((error) => console.log(error));

        let hold_embed = new EmbedBuilder()
          .setColor("Blue")
          .setDescription(`[⏯️] All wars have resumed.`);

        return war_channel.send({ embeds: [hold_embed] }).then((msg) => {
          let data = {
            status: "ongoing",
            message_id: msg.id,
          };
          fs.writeFileSync(
            "./data/guild_war_status.json",
            JSON.stringify(data)
          );
          setTimeout(() => {
            msg.delete();
          }, 3600000);
        });
      } else if (
        !response.data.eligible_for_guild_war &&
        war_status.status == "hold"
      ) {
        return;
      } else {
        let timeout = 3500;
        warList.forEach(function (war, index) {
          setTimeout(() => {
            let cmd = db_gen.prepare(
              `SELECT * FROM wars WHERE guild_1_id=? AND guild_2_id=?`
            );
            let entry = cmd.get(war.guild_1.id, war.guild_2.id);
            if (!entry) return;

            if (entry.status == "ongoing" && war.status == "hold") {
              (async () => {
                let war_channel = client.channels.cache.get(
                  config.server.channels.wars
                );
                let msg = await war_channel.messages
                  .fetch(entry.message_id)
                  .catch(console.log);

                if (msg) {
                  await msg.delete().catch((err) => {
                    console.log("HOLDING WAR MSG.DELETE ERROR: ", err);
                  });
                }

                let war_embed = new EmbedBuilder();
                let bar = createCompetingProgressbar(
                  war.guild_1.kills,
                  war.guild_2.kills
                );

                if (war.guild_1.name == config.guilds[0].name) {
                  war_embed
                    .setColor("Blue")
                    .setDescription(
                      `[⏸] ${config.guilds[0].name} vs. ${war.guild_2.name} was put on hold.\n${war.guild_1.kills} ${bar} ${war.guild_2.kills}`
                    );

                  war_channel
                    .send({ embeds: [war_embed] })
                    .then((msg) => {
                      let cmd = db_gen.prepare(
                        `UPDATE wars SET guild_1_kills=?, guild_2_kills=?, status=?, message_id=? WHERE guild_1_id=? AND guild_2_id=?`
                      );
                      cmd.run(
                        war.guild_1.kills,
                        war.guild_2.kills,
                        war.status,
                        msg.id,
                        war.guild_1.id,
                        war.guild_2.id
                      );
                    })
                    .catch((error) => {
                      console.log("HOLDING WAR ERROR: ", error);
                    });
                } else {
                  war_embed
                    .setColor("Blue")
                    .setDescription(
                      `[⏸] ${war.guild_1.name} vs. ${
                        config.guilds[0].name
                      } was put on hold.\n${
                        war.guild_1.kills
                      } ${bar.invertString()} ${war.guild_2.kills}`
                    );

                  war_channel
                    .send({ embeds: [war_embed] })
                    .then((msg) => {
                      let cmd = db_gen.prepare(
                        `UPDATE wars SET guild_1_kills=?, guild_2_kills=?, status=?, message_id=? WHERE guild_1_id=? AND guild_2_id=?`
                      );
                      cmd.run(
                        war.guild_1.kills,
                        war.guild_2.kills,
                        war.status,
                        msg.id,
                        war.guild_1.id,
                        war.guild_2.id
                      );
                    })
                    .catch((error) => {
                      console.log("HOLDING WAR ERROR: ", error);
                    });
                }
              })();
            }
          }, index * timeout);
        });
      }
    });
  }
  getWarData().then(() => {
    var today = new Date();
    var time =
      (parseInt(today.getHours()) < 10
        ? "0" + today.getHours()
        : today.getHours()) +
      ":" +
      (parseInt(today.getMinutes()) < 10
        ? "0" + today.getMinutes()
        : today.getMinutes());
    console.log(time + " - checked holding wars.");
  });
}
//end of hold check

//sync active wars
function syncActiveWars() {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (!config.guilds[0]) return console.log("Config is missing Guild ID.");
  if (config.server.channels.wars === "undefined")
    return console.log("Config is missing Wars Channel.");

  async function getWarData() {
    var url = `https://api.simple-mmo.com/v1/guilds/wars/${config.guilds[0].id}/1`;
    const api_key = getAPI_Key();

    if (api_key != null) {
      try {
        async function getUserData() {
          try {
            return await axios.post(url, { api_key: api_key });
          } catch (err) {
            console.log(
              "\x1B[3;33m[x] - error with the SMMO api (code 01_WARS_AC)\x1B[0m\n" +
                err
            );
            return null;
          }
        }

        getUserData().then((response) => {
          if (response === null || !response) return;
          var warList = response.data;

          let timeout = 3500;
          warList.forEach(function (war, index) {
            setTimeout(() => {
              let cmd = db_gen.prepare(
                `SELECT * FROM wars WHERE guild_1_id=? AND guild_2_id=?`
              );
              let entry = cmd.get(war.guild_1.id, war.guild_2.id);
              if (entry) {
                if (entry.status == "hold" && war.status == "ongoing") {
                  (async () => {
                    let war_channel = client.channels.cache.get(
                      config.server.channels.wars
                    );
                    let msg = await war_channel.messages
                      .fetch(entry.message_id)
                      .catch(console.log);

                    if (msg) msg.delete().catch(console.log);

                    let war_embed = new EmbedBuilder();
                    let bar = createCompetingProgressbar(
                      war.guild_1.kills,
                      war.guild_2.kills
                    );

                    if (war.guild_1.name == config.guilds[0].name) {
                      war_embed
                        .setColor("Yellow")
                        .setDescription(
                          `[🔪] [${config.guilds[0].name}](https://simplemmo.me/mobile/?page=guilds/view/${config.guilds[0].id}) vs. [${war.guild_2.name}](https://simplemmo.me/mobile/?page=guilds/view/${war.guild_2.id}) resumed.\n${war.guild_1.kills} ${bar} ${war.guild_2.kills}`
                        );

                      war_channel.send({ embeds: [war_embed] }).then((msg) => {
                        let cmd = db_gen.prepare(
                          `UPDATE wars SET guild_1_kills=?, guild_2_kills=?, status=?, message_id=? WHERE guild_1_id=? AND guild_2_id=?`
                        );
                        cmd.run(
                          war.guild_1.kills,
                          war.guild_2.kills,
                          war.status,
                          msg.id,
                          war.guild_1.id,
                          war.guild_2.id
                        );
                      });
                    } else {
                      war_embed
                        .setColor("Yellow")
                        .setDescription(
                          `[🔪] [${
                            war.guild_2.name
                          }](https://simplemmo.me/mobile/?page=guilds/view/${
                            war.guild_2.id
                          }) vs. [${
                            config.guilds[0].name
                          }](https://simplemmo.me/mobile/?page=guilds/view/${
                            config.guilds[0].id
                          }) resumed.\n${
                            war.guild_2.kills
                          } ${bar.invertString()} ${war.guild_1.kills}`
                        );

                      war_channel.send({ embeds: [war_embed] }).then((msg) => {
                        let cmd = db_gen.prepare(
                          `UPDATE wars SET guild_1_kills=?, guild_2_kills=?, status=?, message_id=? WHERE guild_1_id=? AND guild_2_id=?`
                        );
                        cmd.run(
                          war.guild_1.kills,
                          war.guild_2.kills,
                          war.status,
                          msg.id,
                          war.guild_1.id,
                          war.guild_2.id
                        );
                      });
                    }
                  })();
                } else {
                  let cmd = db_gen.prepare(
                    `UPDATE wars SET guild_1_kills=?, guild_2_kills=? WHERE guild_1_id=? AND guild_2_id=?`
                  );
                  cmd.run(
                    war.guild_1.kills,
                    war.guild_2.kills,
                    war.guild_1.id,
                    war.guild_2.id
                  );

                  (async () => {
                    let war_channel = client.channels.cache.get(
                      config.server.channels.wars
                    );
                    let msg = await war_channel.messages
                      .fetch(entry.message_id)
                      .catch(console.log);

                    let war_embed = new EmbedBuilder();
                    let bar = createCompetingProgressbar(
                      war.guild_1.kills,
                      war.guild_2.kills
                    );

                    if (msg) {
                      if (war.guild_1.name == config.guilds[0].name) {
                        war_embed
                          .setColor("Yellow")
                          .setDescription(
                            `[🔥] [${config.guilds[0].name}](https://simplemmo.me/mobile/?page=guilds/view/${config.guilds[0].id}) vs. [${war.guild_2.name}](https://simplemmo.me/mobile/?page=guilds/view/${war.guild_2.id})\n${war.guild_1.kills} ${bar} ${war.guild_2.kills}`
                          );

                        msg.edit({ embeds: [war_embed] }).catch((err) => {
                          console.log("ACTIVE WAR ERROR: ", err);
                        });
                      } else {
                        war_embed
                          .setColor("Yellow")
                          .setDescription(
                            `[🔥] [${
                              war.guild_1.name
                            }](https://simplemmo.me/mobile/?page=guilds/view/${
                              war.guild_1.id
                            }) vs. [${
                              config.guilds[0].name
                            }](https://simplemmo.me/mobile/?page=guilds/view/${
                              config.guilds[0].id
                            })\n${war.guild_1.kills} ${bar.invertString()} ${
                              war.guild_2.kills
                            }`
                          );

                        msg.edit({ embeds: [war_embed] }).catch((err) => {
                          "ACTIVE WAR ERROR: ", console.log(err);
                        });
                      }
                    }
                  })();
                }
              } else {
                //new war, send new embed
                let war_embed = new EmbedBuilder();
                let bar = createCompetingProgressbar(
                  war.guild_1.kills,
                  war.guild_2.kills
                );

                if (war.guild_1.name == config.guilds[0].name) {
                  war_embed
                    .setColor("Yellow")
                    .setDescription(
                      `[🔥] [${config.guilds[0].name}](https://simplemmo.me/mobile/?page=guilds/view/${config.guilds[0].id}) vs. [${war.guild_2.name}](https://simplemmo.me/mobile/?page=guilds/view/${war.guild_2.id})\n${war.guild_1.kills} ${bar} ${war.guild_2.kills}`
                    );

                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] })
                    .then((msg) => {
                      let cmd = db_gen.prepare(
                        `INSERT INTO wars VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                      );
                      cmd.run(
                        war.guild_1.id,
                        war.guild_1.name,
                        war.guild_1.kills,
                        war.guild_2.kills,
                        war.guild_2.name,
                        war.guild_2.id,
                        war.status,
                        msg.id
                      );
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                } else {
                  war_embed
                    .setColor("Yellow")
                    .setDescription(
                      `[🔥] [${
                        war.guild_1.name
                      }](https://simplemmo.me/mobile/?page=guilds/view/${
                        war.guild_1.id
                      }) vs. [${
                        config.guilds[0].name
                      }](https://simplemmo.me/mobile/?page=guilds/view/${
                        config.guilds[0].id
                      })\n${war.guild_1.kills} ${bar.invertString()} ${
                        war.guild_2.kills
                      }`
                    );

                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] })
                    .then((msg) => {
                      let cmd = db_gen.prepare(
                        `INSERT INTO wars VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                      );
                      cmd.run(
                        war.guild_1.id,
                        war.guild_1.name,
                        war.guild_1.kills,
                        war.guild_2.kills,
                        war.guild_2.name,
                        war.guild_2.id,
                        war.status,
                        msg.id
                      );
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              }
            }, index * timeout);
          });
        });
      } catch {
        console.log("\x1B[3;33m[x] - error with the SMMO api\x1B[0m");
      }
    }
  }
  getWarData().then(() => {
    var today = new Date();
    var time =
      (parseInt(today.getHours()) < 10
        ? "0" + today.getHours()
        : today.getHours()) +
      ":" +
      (parseInt(today.getMinutes()) < 10
        ? "0" + today.getMinutes()
        : today.getMinutes());
    console.log(time + " - checked active wars.");
  });
}
//end of active war check

//start of ending war sync
function checkEndingWars() {
  if (!fs.existsSync("./data/config.json"))
    return console.log("Config not initialized.");

  async function activeCheck() {
    let config = JSON.parse(fs.readFileSync("./data/config.json"));
    if (!config.guilds[0]) return console.log("Config is missing Guild ID.");

    var url = `https://api.simple-mmo.com/v1/guilds/wars/${config.guilds[0].id}/1`;
    let api_key = await getAPI_Key();

    if (api_key == null) return null;

    try {
      var response = await axios.post(url, { api_key: api_key });
    } catch (err) {
      console.log("\x1B[3;33m[x] - error with the SMMO api\x1B[0m\n" + err);
      return null;
    }

    var war_list = [];
    var warList = await response.data;

    let wars = db_gen.prepare(`SELECT * FROM wars`).all();

    wars.forEach((local_war) => {
      let exists = false;
      warList.forEach((war) => {
        if (!exists) {
          if (
            local_war.guild_1_id === war.guild_1.id &&
            local_war.guild_2_id === war.guild_2.id
          ) {
            exists = true;
          }
        } else return;
      });
      if (!exists) {
        war_list.push([
          local_war.guild_1_id,
          local_war.guild_1_name,
          local_war.guild_1_kills,
          local_war.guild_2_id,
          local_war.guild_2_name,
          local_war.guild_2_kills,
        ]);
      }
    });

    return war_list[0] == undefined ? null : war_list;
  }

  async function holdCheck(war_list) {
    let config = JSON.parse(fs.readFileSync("./data/config.json"));
    if (!config.guilds[0]) return console.log(`Config is missing Guild ID`);

    //check for hold
    if (war_list == null || war_list == undefined) return null;

    let api_key = getAPI_Key();
    if (api_key != null) {
      var verify_url = `https://api.simple-mmo.com/v1/guilds/wars/${config.guilds[0].id}/3`;

      try {
        var response = await axios.post(verify_url, { api_key: api_key });
      } catch (err) {
        console.log("\x1B[3;33m[x] - error with the SMMO api\x1B[0m\n" + err);
        return null;
      }
      if (response === null) return;
      var warList = await response.data;

      warList.forEach((war) => {
        for (let i = 0; i < war_list.length; i++) {
          if (
            war.guild_1.id == war_list[i][0] &&
            war.guild_2.id == war_list[i][3]
          ) {
            war_list.splice(i, 1);
          }
        }
      });

      return war_list;
    }
  }

  async function endCheck(war_list) {
    //check for ended
    if (war_list == null || war_list == undefined) return;

    let config = JSON.parse(fs.readFileSync("./data/config.json"));
    if (!config.guilds[0]) return console.log(`Config is missing Guild ID`);
    if (config.guilds[0].name === "undefined")
      return console.log(`Config is missing Guild Name`);
    if (config.server.channels.wars === "undefined")
      return console.log(`Config is missing Wars Channel`);

    let api_key = getAPI_Key();
    if (api_key != null) {
      var verify_url = `https://api.simple-mmo.com/v1/guilds/wars/${config.guilds[0].id}/2`;

      try {
        var response = await axios.post(verify_url, { api_key: api_key });
      } catch {
        console.log("\x1B[3;33m[x] - error with the SMMO api\x1B[0m");
      }
      if (!response || response === null) return;

      var warList = await response.data;

      for (let i = 0; i < war_list.length; i++) {
        for (let j = 0; j < warList.length; j++) {
          if (
            warList[j].guild_1.id == war_list[i][0] &&
            warList[j].guild_2.id == war_list[i][3]
          ) {
            let cmd = db_gen.prepare(
              `SELECT * FROM wars WHERE guild_1_id=? AND guild_2_id=?`
            );
            let entry = cmd.get(warList[j].guild_1.id, warList[j].guild_2.id);

            if (entry) {
              let war_channel = client.channels.cache.get(
                config.server.channels.wars
              );
              let msg = await war_channel.messages
                .fetch(entry.message_id)
                .catch(console.log);
              if (msg) msg.delete().catch(console.log);

              let guild_id =
                warList[j].guild_1.id == config.guilds[0].id
                  ? warList[j].guild_2.id
                  : warList[j].guild_1.id;
              let guild_name =
                warList[j].guild_1.name == config.guilds[0].name
                  ? warList[j].guild_2.name
                  : warList[j].guild_1.name;
              let timestamp = Math.floor(Math.floor(Date.now() / 1000));

              let cmd = db_gen.prepare(
                `INSERT INTO endedwars VALUES (?, ?, ?)`
              );
              cmd.run(guild_id, guild_name, timestamp);

              cmd = db_gen.prepare(
                `DELETE FROM wars WHERE guild_1_id=? AND guild_2_id=?`
              );
              cmd.run(warList[j].guild_1.id, warList[j].guild_2.id);

              //send notice
              let war_embed = new EmbedBuilder();
              let bar = createCompetingProgressbar(
                warList[j].guild_1.kills,
                warList[j].guild_2.kills
              );
              if (parseInt(warList[j].guild_1.kills) === 2000) {
                if (warList[j].guild_1.id == config.guilds[0].id) {
                  war_embed
                    .setColor("Green")
                    .setDescription(
                      `[❗] ${config.guilds[0].name} won the war against ${warList[j].guild_2.name}\n${warList[j].guild_1.kills} ${bar} ${warList[j].guild_2.kills}`
                    );
                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] });
                } else {
                  war_embed
                    .setColor("Red")
                    .setDescription(
                      `[❗] ${config.guilds[0].name} lost the war against ${warList[j].guild_1.name}\n${warList[j].guild_2.kills} ${bar} ${warList[j].guild_1.kills}`
                    );
                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] });
                }
              } else {
                if (war.guild_2.id == config.guilds[0].id) {
                  war_embed
                    .setColor("Red")
                    .setDescription(
                      `[❗] ${config.guilds[0].name} lost the war against ${warList[j].guild_1.name}\n${warList[j].guild_2.kills} ${bar} ${warList[j].guild_1.kills}`
                    );
                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] });
                } else {
                  war_embed
                    .setColor("Green")
                    .setDescription(
                      `[❗] ${config.guilds[0].name} won the war against ${warList[j].guild_2.name}\n${warList[j].guild_1.kills} ${bar} ${warList[j].guild_2.kills}`
                    );
                  client.channels.cache
                    .get(config.server.channels.wars)
                    .send({ embeds: [war_embed] });
                }
              }
            }
            j = warList.length;
          }
        }
      }
    }
  }

  function checkWars() {
    activeCheck().then((res_active) => {
      holdCheck(res_active).then((res_hold) => {
        endCheck(res_hold);
      });
    });
    //await endCheck(await holdCheck(await activeCheck()));
  }
  checkWars();
}
//end of war check

//function to check for users' targets' safemode
setInterval(() => {
  if (!db_gen) return;
  var targets_found = [];

  async function getTargets() {
    let targets = db_gen.prepare(`SELECT * FROM targets`).all();

    for (let i = 0; i < targets.length; i++) {
      var targetID = targets[i].target_id;
      var url = "https://api.simple-mmo.com/v1/player/info/" + targetID;
      var api_key = getAPI_Key();

      if (api_key != null) {
        async function getUserData() {
          try {
            return await axios.post(url, { api_key: api_key });
          } catch (err) {
            console.log(
              "\x1B[3;33m[x] - error with the SMMO api (code 01_WARS_SM)\x1B[0m\n" +
                err
            );
            return null;
          }
        }

        getUserData().then((response) => {
          if (!response || response === null) return;
          var user_data = response.data;

          if (user_data.safeMode == 0) {
            //target left safemode
            targets_found.push([
              targets[i].member_id,
              targets[i].target_id,
              user_data.name,
            ]);
          }
        });
      }
    }
  }

  //0 = userID
  //1 = targetID
  //2 = name

  //call the user sync function
  getTargets().then(async () => {
    for (let i = 0; i < targets_found.length; i++) {
      let targetEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setThumbnail(client.user.displayAvatarURL(), true)
        .setTitle(`User ${targets_found[i][2]} just left safemode!`)
        .addFields({
          name: "User Actions",
          value:
            "[[Profile]](https://web.simple-mmo.com/user/view/" +
            targets_found[k][1] +
            ") | [[Attack]](https://web.simple-mmo.com/user/attack/" +
            targets_found[k][1] +
            ")",
        })
        .setTimestamp();

      let user = client.users.fetch(targets_found[k][0]);
      if (user) user.send({ embeds: [targetEmbed] }).catch(console.log);

      let res = db_gen
        .prepare(`DELETE FROM targets WHERE member_id=? AND target_id=?`)
        .run(targets_found[0], targets_found[1]);
    }
  });
}, 30000);
//end of safemode check

//function to open a ticket
async function createTicket(interaction, type, reason, link = null) {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.roles.moderator.id === "undefined")
    return interaction.reply({
      content:
        "The Moderator role is not set up correctly.\nUse /set role moderator to set it up.",
      ephemeral: true,
    });
  if (config.server.roles.guildmember.id === "undefined")
    return interaction.reply({
      content:
        "The Guild Member role is not set up correctly.\nUse /set role guildmember to set it up.",
      ephemeral: true,
    });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
  });

  await channel.setParent(interaction.channel.parent);

  channel.permissionOverwrites.edit(interaction.guild.id, {
    ViewChannel: false,
  });
  channel.permissionOverwrites.edit(config.server.roles.guildmember.id, {
    ViewChannel: false,
  });

  channel.permissionOverwrites.edit(interaction.user.id, {
    ViewChannel: true,
    SendMessages: true,
  });
  channel.permissionOverwrites.edit("189764769312407552", {
    ViewChannel: true,
  });

  let embed = new EmbedBuilder();
  switch (type) {
    case "general":
      embed
        .setTitle("General Inquiry")
        .setColor("Green")
        .setDescription(
          `User: ${interaction.user}${
            link === null
              ? ""
              : `\nProfile: [Link](https://web.simple-mmo.com/user/view/${link})`
          }\n\n__Reason:__\n${reason}`
        );
      break;
    case "new_role":
      embed
        .setTitle("New Custom Role")
        .setColor(reason.color)
        .setDescription(
          `User: ${interaction.user}${
            link === null
              ? ""
              : `\nProfile: [Link](https://web.simple-mmo.com/user/view/${link})`
          }\n\n__Details:__\nName: ${reason.name}\nColor: ${
            reason.color
          }\nEmoji: ${reason.emoji}`
        );
      break;
    case "edit_role":
      embed
        .setTitle("Edit Custom Role")
        .setColor(reason.color)
        .setDescription(
          `User: ${interaction.user}${
            link === null
              ? ""
              : `\nProfile: [Link](https://web.simple-mmo.com/user/view/${link})`
          }\n\n__Details:__\nName: ${reason.name}\nColor: ${
            reason.color
          }\nEmoji: ${reason.emoji}`
        );
      break;
    case "redeem_points":
      embed
        .setTitle("Point Redemption")
        .setColor("Green")
        .setDescription(
          `User: ${interaction.user}${
            link === null
              ? ""
              : `\nProfile: [Link](https://web.simple-mmo.com/user/view/${link})`
          }\n\n__Details:__\nType: ${reason.type}\nAmount: ${reason.quantity}`
        );
      break;
    default:
      return console.log(`${type} is not a valid input.`);
  }

  const reactionMessage = await channel.send({
    content: `Thank you for opening a ticket, ${interaction.user}.`,
    embeds: [embed],
  });

  await reactionMessage.pin();
  reactionMessage.react("🔒");
  reactionMessage.react("<:BB_Cross:1031690265334911086>");

  return channel;
}
//end of ticket function

var progressBar = "";
var questType, rawData, userLink, thenValue, nowValue;
var userIsLinked, userHasDBEntry;
var errorWildcard = false;

//define function check eligibility
function checkEligibility(userID, questID) {
  let quest_data = db_gen
    .prepare(`SELECT * FROM quests WHERE id=?`)
    .get(questID);
  questType = quest_data.type;
  rawData = quest_data.raw_data;

  let link_data = db_gen
    .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
    .get(userID);
  if (!link_data) {
    userIsLinked = false;
    return false;
  }
  userLink = link_data.SMMO_ID;

  userIsLinked = true;

  let data_then = db_ud
    .prepare(`SELECT * FROM UserData WHERE id=?`)
    .get(userLink);
  let data_now = db_ud
    .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
    .get(userLink);
  if (!data_then || !data_now) {
    userHasDBEntry = false;
    return false;
  }

  userHasDBEntry = true;

  switch (questType) {
    case "levels":
      thenValue = data_then.level;
      nowValue = data_now.level;
      break;
    case "steps":
      thenValue = data_then.steps;
      nowValue = data_now.steps;
      break;
    case "NPCs":
      thenValue = data_then.npc;
      nowValue = data_now.npc;
      break;
    case "PVP":
      thenValue = data_then.pvp;
      nowValue = data_now.pvp;
      break;
    case "quests":
      thenValue = data_then.quests;
      nowValue = data_now.quests;
      break;
    case "tasks":
      thenValue = data_then.tasks;
      nowValue = data_now.tasks;
      break;
    case "boss":
      thenValue = data_then.bosses;
      nowValue = data_now.bosses;
      break;
    case "bounty":
      thenValue = data_then.bounties;
      nowValue = data_now.bounties;
      break;
  }

  if (nowValue - thenValue >= rawData) {
    return true;
  } else {
    //create the percentage
    var z = ((nowValue - thenValue) / rawData) * 100;

    //create the progress bar
    for (var i = 0; i < 100; i += 5) {
      if (z - 5 >= 0) {
        progressBar += "▰";
        z -= 5;
      } else {
        progressBar += "▱";
      }
    }
    return false;
  }
}
//end of function

//define quest completion by x users
async function updateQuestCompletion(index) {
  let config = JSON.parse(fs.readFileSync("./data/config.json"));
  if (config.server.channels.quests === "undefined") return;

  let quest_data = db_gen.prepare(`SELECT * FROM quests WHERE id=?`).get(index);

  let new_comp = quest_data.completion + 1;

  db_gen
    .prepare(`UPDATE quests SET completion=? WHERE id=?`)
    .run(new_comp, index);

  let newEmbed = new EmbedBuilder()
    .setColor("#2f3136")
    .setThumbnail(client.user.displayAvatarURL(), true)
    .setTitle(`**Quest #${quest_data.id}**`)
    .addFields({
      name: "**Description**",
      value: `${quest_data.description}`,
      inline: true,
    })
    .setFooter({
      text: `Completed by ${new_comp} users.\nLast completed: ${getTimeStamp()}`,
    });

  let channel = client.channels.cache.get(config.server.channels.quests);
  channel.messages.fetch(quest_data.msg_id).then((msg) => {
    msg.edit({ embeds: [newEmbed] }).catch((e) => {
      return "Error ";
    });
  });
}
//end of completion definition

//define weekly user completion lock
function weeklyCheck(userID, questID) {
  var weeklycheck = db_gen
    .prepare(`SELECT * FROM weeklycheck WHERE id=?`)
    .get(userID);
  if (weeklycheck) {
    let cmd = db_gen.prepare(
      `UPDATE weeklycheck SET q_${questID} = ? WHERE id = ?`
    );
    cmd.run(1, userID);
  } else {
    switch (questID) {
      case 1:
        var in_cmd = db_gen.prepare(
          `INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`
        );
        in_cmd.run(userID, 1, 0, 0, 0, 0);
        break;
      case 2:
        var in_cmd = db_gen.prepare(
          `INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`
        );
        in_cmd.run(userID, 0, 1, 0, 0, 0);
        break;
      case 3:
        var in_cmd = db_gen.prepare(
          `INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`
        );
        in_cmd.run(userID, 0, 0, 1, 0, 0);
        break;
      case 4:
        var in_cmd = db_gen.prepare(
          `INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`
        );
        in_cmd.run(userID, 0, 0, 0, 1, 0);
        break;
      case 5:
        var in_cmd = db_gen.prepare(
          `INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`
        );
        in_cmd.run(userID, 0, 0, 0, 0, 1);
        break;
      default:
        break;
    }
  }
}
//end of function

//define weekly user completion check
function hasCompleted(userID, questID) {
  var weeklycheck = db_gen
    .prepare(`SELECT * FROM weeklycheck WHERE id=?`)
    .get(userID);
  if (weeklycheck) {
    switch (questID) {
      case 1:
        if (weeklycheck.q_1 === 1) return true;
        break;
      case 2:
        if (weeklycheck.q_2 === 1) return true;
        break;
      case 3:
        if (weeklycheck.q_3 === 1) return true;
        break;
      case 4:
        if (weeklycheck.q_4 === 1) return true;
        break;
      case 5:
        if (weeklycheck.q_5 === 1) return true;
        break;
      default:
        break;
    }
  } else return false;
}
//end of function

//defining point award function
function awardPoints(user, questid) {
  var current_points = db_gen
    .prepare(`SELECT * FROM points WHERE id=?`)
    .get(user.id);

  if (current_points) {
    let new_points = current_points.points + 2;

    let cmd = db_gen.prepare(`UPDATE points SET points = ? WHERE id = ?`);
    cmd.run(new_points, user.id);
  } else {
    let cmd = db_gen.prepare(`INSERT INTO points VALUES (?, ?, ?)`);
    cmd.run(user.id, user.username, 2);
  }
}
//end of func definition

//reaction handler
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  if (!reaction.message.guild) return;
  if (user.bot) return;

  let config = JSON.parse(fs.readFileSync("./data/config.json"));

  if (config.server.roles.guildmember.id === "undefined")
    return console.log("Config is missing Guildmember Role.");
  if (config.server.roles.moderator.id === "undefined")
    return console.log("Config is missing Moderator role.");
  if (!config.guilds[0]) return console.log("Config is missing Guild ID");

  let reaction_data = JSON.parse(fs.readFileSync("./data/reactions.json"));

  if (reaction.message.channel.name.startsWith("ticket")) {
    let guild = await client.guilds.fetch(GUILD_ID);
    let member = await guild.members.fetch(user.id);
    if (
      !member.roles.cache.find(
        (r) => r.id === config.server.roles.moderator.id
      ) &&
      user.id !== "189764769312407552"
    )
      return reaction.users.remove(user.id);

    var userName = reaction.message.channel.name.replace("ticket-", "");
    var owner = client.users.cache.find(
      (user) =>
        user.username.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "") ==
        userName.toLowerCase()
    );

    if (!owner)
      return reaction.message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `<:BB_Cross:1031690265334911086> Error retrieving ticket owner.`
            ),
        ],
      });

    switch (reaction.emoji.name) {
      case "🔒":
        reaction.message.channel.permissionOverwrites.edit(owner.id, {
          SendMessages: false,
        });
        break;
      case "BB_Cross":
        try {
          owner.send(
            "[<:BB_Cross:1031690265334911086>] Your ticket has been closed."
          );
        } catch {
          console.log(`Could not notify ${owner.username} about their ticket.`);
        }
        reaction.message.channel.delete();
        break;
      default:
        return;
    }
  }

  //          OUTDATED            //
  // //Guild role managing
  // let guildrole_msg_id = reaction_data.guildrole.id;
  // let guildrole_id = config.server.roles.guildmember.id;
  // if (reaction.emoji.name === "🪙" && reaction.message.id === guildrole_msg_id) {
  //     var api_key = getAPI_Key();

  //     if (api_key != null) {
  //         var url = `https://api.simple-mmo.com/v1/guilds/members/${config.guilds[0].id}`

  //         let tempMember = client.guilds.cache.get(GUILD_ID).members.cache.get(user.id)

  //         try {
  //             async function getUserData() {
  //                 try {
  //                     return await axios.post(url, { api_key: api_key });
  //                 } catch (err) {
  //                     console.log("\x1B[3;33m[x] - error with the SMMO api (code 01)\x1B[0m\n" + err)
  //                     return null;
  //                 }
  //             }

  //             var exists = false;
  //             getUserData().then(response => {
  //                 if (response === null) return;
  //                 smmoUsers = response.data;

  //                 smmoUsers.forEach(smmoUser => {
  //                     var tempMemberName = "";
  //                     if (tempMember.nickname != undefined) {
  //                         tempMemberName = tempMember.nickname;
  //                     } else {
  //                         tempMemberName = tempMember.user.username;
  //                     }
  //                     if (smmoUser.name.toLowerCase() == tempMemberName.toLowerCase() && !tempMember.roles.cache.find(r => r.id === guildrole_id)) {
  //                         var role = client.guilds.cache.get(GUILD_ID).roles.cache.find(r => r.id === guildrole_id)
  //                         tempMember.roles.add(role);

  //                         if (config.server.channels.welcome !== "undefined") {
  //                             user.send("[❗] Guild Role added, welcome to the guild!").catch(console.log);
  //                             exists = true;
  //                         } else {
  //                             console.log("Config is missing Welcome Channel.")
  //                         }
  //                     }
  //                 })
  //                 if (tempMember.roles.cache.find(r => r.id === guildrole_id)) { exists = true; }
  //                 if (!exists) {
  //                     user.send("Your nickname could not be found in the guild.\n" +
  //                         "Make sure you change your nickname to match your ingame name exactly.\n" +
  //                         "If you think this is an error, ping n3xistence#0003").catch(console.log);
  //                 }
  //             });
  //         } catch {
  //             console.log("\x1B[3;33m[x] - error while handling Guildmember reaction role\x1B[0m")
  //         }
  //     } else {
  //         user.send("The API is currently at its limit, try again in 60 seconds.").catch(console.log);
  //     }
  //     try {
  //         reaction.users.remove(user.id);
  //     } catch { }
  // }
  //end of role managing

  //Guild Ranks

  let ranks = JSON.parse(fs.readFileSync("./data/ranks.json"));
  let ranks_channel = config.server.channels.ranklogs;

  if (reaction.message.id == ranks.steps.id) {
    let tempMember = client.guilds.cache
      .get(GUILD_ID)
      .members.cache.get(user.id);

    let data = getAlltimeUserData(user.id);
    if (data == "error") {
      try {
        reaction.users.remove(user.id);
      } catch {}
      return;
    }

    if (reaction.emoji.name === "🥇") {
      if (
        data[0] >= ranks.steps.rank1.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank1.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank3.role)
      ) {
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.steps.rank1.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥇]<👣> <@" + tempMember.id + ">  just claimed Steps Rank 1."
        );
        user
          .send(
            "[🥇]<👣> Congratulations on claiming Rank 1 in the Steps category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥈") {
      if (
        data[0] >= ranks.steps.rank2.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank3.role)
      ) {
        if (
          tempMember.roles.cache.find((r) => r.id === ranks.steps.rank1.role)
        ) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.steps.rank1.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.steps.rank2.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥈]<👣> <@" + tempMember.id + ">  just claimed steps Rank 2."
        );
        user
          .send(
            "[🥈]<👣> Congratulations on claiming Rank 2 in the Steps category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥉") {
      if (
        data[0] >= ranks.steps.rank3.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.steps.rank3.role)
      ) {
        if (
          tempMember.roles.cache.find((r) => r.id === ranks.steps.rank1.role)
        ) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.steps.rank1.role);
          tempMember.roles.remove(role);
        }
        if (
          tempMember.roles.cache.find((r) => r.id === ranks.steps.rank2.role)
        ) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.steps.rank2.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.steps.rank3.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥉]<👣> <@" + tempMember.id + ">  just claimed steps Rank 3."
        );
        user
          .send(
            "[🥉]<👣> Congratulations on claiming Rank 3 in the Steps category!"
          )
          .catch(console.log);
      }
    }
    try {
      reaction.users.remove(user.id);
    } catch {}
  } else if (reaction.message.id == ranks.NPC.id) {
    let tempMember = client.guilds.cache
      .get(GUILD_ID)
      .members.cache.get(user.id);

    let data = getAlltimeUserData(user.id);
    if (data == "error") {
      try {
        reaction.users.remove(user.id);
      } catch {}
      return;
    }

    if (reaction.emoji.name === "🥇") {
      if (
        data[1] >= ranks.NPC.rank1.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank1.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank3.role)
      ) {
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.NPC.rank1.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥇]<👤> <@" + tempMember.id + ">  just claimed NPCs Rank 1."
        );
        user
          .send(
            "[🥇]<👤> Congratulations on claiming Rank 1 in the NPC category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥈") {
      if (
        data[1] >= ranks.NPC.rank2.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank3.role)
      ) {
        if (tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank1.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.NPC.rank1.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.NPC.rank2.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥈]<🔪> <@" + tempMember.id + ">  just claimed NPC Rank 2."
        );
        user
          .send(
            "[🥈]<👤> Congratulations on claiming Rank 2 in the NPC category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥉") {
      if (
        data[1] >= ranks.NPC.rank3.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank3.role)
      ) {
        if (tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank1.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.NPC.rank1.role);
          tempMember.roles.remove(role);
        }
        if (tempMember.roles.cache.find((r) => r.id === ranks.NPC.rank2.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.NPC.rank2.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.NPC.rank3.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥉]<🔪> <@" + tempMember.id + ">  just claimed NPC Rank 3."
        );
        user
          .send(
            "[🥉]<👤> Congratulations on claiming Rank 3 in the NPC category!"
          )
          .catch(console.log);
      }
    }
    try {
      reaction.users.remove(user.id);
    } catch {}
  } else if (reaction.message.id == ranks.PVP.id) {
    let tempMember = client.guilds.cache
      .get(GUILD_ID)
      .members.cache.get(user.id);

    let data = getAlltimeUserData(user.id);
    if (data === "error") {
      try {
        reaction.users.remove(user.id);
      } catch {}
      return;
    }

    if (reaction.emoji.name === "🥇") {
      if (
        data[2] >= ranks.PVP.rank1.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank1.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank3.role)
      ) {
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.PVP.rank1.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥇]<🔪> <@" + tempMember.id + ">  just claimed PVP Rank 1."
        );
        user
          .send(
            "[🥇]<🔪> Congratulations on claiming Rank 1 in the PVP category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥈") {
      if (
        data[2] >= ranks.PVP.rank2.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank2.role) &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank3.role)
      ) {
        if (tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank1.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.PVP.rank1.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.PVP.rank2.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥈]<🔪> <@" + tempMember.id + ">  just claimed PVP Rank 2."
        );
        user
          .send(
            "[🥈]<🔪> Congratulations on claiming Rank 2 in the PVP category!"
          )
          .catch(console.log);
      }
    }
    if (reaction.emoji.name === "🥉") {
      if (
        data[2] >= ranks.PVP.rank3.value &&
        !tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank3.role)
      ) {
        if (tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank1.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.PVP.rank1.role);
          tempMember.roles.remove(role);
        }
        if (tempMember.roles.cache.find((r) => r.id === ranks.PVP.rank2.role)) {
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === ranks.PVP.rank2.role);
          tempMember.roles.remove(role);
        }
        var role = client.guilds.cache
          .get(GUILD_ID)
          .roles.cache.find((r) => r.id === ranks.PVP.rank3.role);
        tempMember.roles.add(role);
        var channel = client.channels.cache.get(ranks_channel);
        channel.send(
          "[🥉]<🔪> <@" + tempMember.id + ">  just claimed PVP Rank 3."
        );
        user
          .send(
            "[🥉]<🔪> Congratulations on claiming Rank 3 in the PVP category!"
          )
          .catch(console.log);
      }
    }
    try {
      reaction.users.remove(user.id);
    } catch {}
  } else if (reaction.message.id == ranks.gold.id) {
    let tempMember = client.guilds.cache
      .get(GUILD_ID)
      .members.cache.get(user.id);

    if (
      reaction.emoji.name === "🥇" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank1.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank2.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥇]<🪙> <@" +
          tempMember.id +
          ">  just requested gold donation Rank 1."
      );
      user
        .send(
          "[🥇]<🪙> You successfully requested gold donation Rank 1. Please wait up to 24h for the role."
        )
        .catch(console.log);
    }
    if (
      reaction.emoji.name === "🥈" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank2.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥈]<🪙> <@" +
          tempMember.id +
          ">  just requested gold donation Rank 2."
      );
      user
        .send(
          "[🥈]<🪙> You successfully requested Gold Donation Rank 2. Please wait up to 24h for the role and up to a week for your custom item."
        )
        .catch(console.log);
    }
    if (
      reaction.emoji.name === "🥉" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.gold.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥉]<🪙> <@" +
          tempMember.id +
          ">  just requested gold donation Rank 3."
      );
      user
        .send(
          "[🥉]<🪙> You successfully requested Gold Donation Rank 3. Please wait up to 24h for the role and up to a week for your custom item."
        )
        .catch(console.log);
    }
    try {
      reaction.users.remove(user.id);
    } catch {}
  } else if (reaction.message.id == ranks.pp.id) {
    let tempMember = client.guilds.cache
      .get(GUILD_ID)
      .members.cache.get(user.id);

    if (
      reaction.emoji.name === "🥇" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank1.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank2.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥇]<🔮> <@" + tempMember.id + ">  just requested pp donation Rank 1."
      );
      user
        .send(
          "[🥇]<🔮> You successfully requested Powerpoint Donation Rank 1. Please wait up to 24h for the role."
        )
        .catch(console.log);
    }
    if (
      reaction.emoji.name === "🥈" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank2.role) &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥈]<🔮> <@" + tempMember.id + ">  just requested pp donation Rank 2."
      );
      user
        .send(
          "[🥈]<🔮> You successfully requested Powerpoint Donation Rank 2. Please wait up to 24h for the role and up to a week for your custom item."
        )
        .catch(console.log);
    }
    if (
      reaction.emoji.name === "🥉" &&
      !tempMember.roles.cache.find((r) => r.id === ranks.pp.rank3.role)
    ) {
      var channel = client.channels.cache.get(ranks_channel);
      channel.send(
        "[🥉]<🔮> <@" + tempMember.id + ">  just requested pp donation Rank 3."
      );
      user
        .send(
          "[🥉]<🔮> You successfully requested Powerpoint Donation Rank 3. Please wait up to 24h for the role and up to a week for your custom item."
        )
        .catch(console.log);
    }
    try {
      reaction.users.remove(user.id);
    } catch {}
  }
  //End of Guild Ranks
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  if (user.bot) return;
  if (!reaction.message.guild) return;
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.channel.type === "dm") return;
  let user = message.author;

  let args = message.content.split(" ");
  if (message.content.startsWith("/")) {
    let command_file_names = commandFiles
      .filter((elem) => elem.endsWith(".js"))
      .map((elem) => elem.replace(".js", ""));
    if (!command_file_names.includes(args[0].replace("/", ""))) return;

    message.delete();
    return message.channel
      .send({
        content: `${message.author}`,
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Wrong command usage.")
            .setDescription(
              `[<:BB_Cross:1031690265334911086>] To use slash commands, type in the command name and then tap the option that shows up above your chat input window before hitting send.`
            ),
        ],
      })
      .then((msg) => {
        setTimeout(() => {
          msg.delete();
        }, 15000);
      });
  }

  if (message.member.guild.id === GUILD_ID) {
    let config = JSON.parse(fs.readFileSync("./data/config.json"));
    let link_data = db_gen
      .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
      .get(user.id);
    if (!link_data) return;
    let link = link_data.SMMO_ID;

    let user_data = db_ud
      .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
      .get(link);
    if (!user_data) return;
    let userData = user_data.level;

    let role_100k = config.server.roles.levels.r_100k;
    let role_50k = config.server.roles.levels.r_50k;
    let role_10k = config.server.roles.levels.r_10k;
    let role_5k = config.server.roles.levels.r_5k;
    let role_1k = config.server.roles.levels.r_1k;
    let role_below1k = config.server.roles.levels.r_below1k;

    if (userData > 100000) {
      if (!message.member.roles.cache.find((r) => r.id === role_100k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_50k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_50k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_10k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_10k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_5k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_5k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_1k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_below1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_below1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_100k);
          message.member.roles.add(role);
        } catch {
          console.log(`Unable to assign role to ${message.author.username}`);
        }
      }
    } else if (userData > 50000) {
      if (!message.member.roles.cache.find((r) => r.id === role_50k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_100k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_100k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_10k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_10k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_5k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_5k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_1k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_below1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_below1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_50k);
          message.member.roles.add(role);
        } catch {
          console.log(`Unable to assign role to ${message.author.username}`);
        }
      }
    } else if (userData > 10000) {
      if (!message.member.roles.cache.find((r) => r.id === role_10k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_100k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_100k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_50k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_50k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_5k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_5k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_1k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_below1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_below1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_10k);
          message.member.roles.add(role);
        } catch {
          console.log(
            "unable to assign role 10,000+ to " + message.author.username
          );
        }
      }
    } else if (userData > 5000) {
      if (!message.member.roles.cache.find((r) => r.id === role_5k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_100k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_100k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_50k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_50k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_10k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_10k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_1k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_below1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_below1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_5k);
          message.member.roles.add(role);
        } catch {
          console.log(`Unable to assign role to ${message.author.username}`);
        }
      }
    } else if (userData > 1000) {
      if (!message.member.roles.cache.find((r) => r.id === role_1k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_100k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_100k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_50k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_50k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_10k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_10k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_5k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_5k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_below1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_below1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_1k);
          message.member.roles.add(role);
        } catch {
          console.log(`Unable to assign role to ${message.author.username}`);
        }
      }
    } else if (userData < 1000) {
      if (!message.member.roles.cache.find((r) => r.id === role_below1k)) {
        try {
          if (message.member.roles.cache.find((r) => r.id === role_100k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_100k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_50k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_50k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_10k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_10k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_5k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_5k);
            message.member.roles.remove(role);
          }
          if (message.member.roles.cache.find((r) => r.id === role_1k)) {
            var role = client.guilds.cache
              .get(GUILD_ID)
              .roles.cache.find((r) => r.id === role_1k);
            message.member.roles.remove(role);
          }
          var role = client.guilds.cache
            .get(GUILD_ID)
            .roles.cache.find((r) => r.id === role_below1k);
          message.member.roles.add(role);
        } catch {
          console.log(`Unable to assign role to ${message.author.username}`);
        }
      }
    }
  }
});
//end of discord - ingame level sync

//interaction handler
client.on("interactionCreate", async (interaction) => {
  if (interaction.message)
    if (interaction.message.partial) await interaction.message.fetch();

  //handle commands
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // if (!db_gen) var db_gen = "undefined";
    // if (!db_ud) var db_ud = "undefined";

    try {
      await command
        .execute(interaction, Discord, client, version, helper, db_gen, db_ud)
        .catch(console.log);
    } catch (err) {
      console.log(err);
      try {
        await interaction
          .reply({ content: "There has been an error.", ephemeral: true })
          .catch(console.log);
      } catch (err) {
        if (err.code === 10062)
          return interaction.channel.send(
            `${interaction.user} Error processing interaction.`
          );
        console.log(err);
      }
    }
  }
  //end of command handler

  //handle buttons
  if (interaction.isButton()) {
    let config = JSON.parse(fs.readFileSync("./data/config.json"));

    //handle giveaways
    let giveaway_list = JSON.parse(fs.readFileSync("./data/giveaways.json"));
    if (interaction.customId === "join_giveaway") {
      console.log("Join Giveaway Request Received");
      for (let i = 0; i < giveaway_list.current.length; i++) {
        if (interaction.message.id !== giveaway_list.current[i].msg.id)
          continue;

        for (let j = 0; j < giveaway_list.current[i].users.length; j++) {
          if (giveaway_list.current[i].users[j].id !== interaction.user.id)
            continue;

          giveaway_list.current[i].users.splice(j, 1);
          fs.writeFileSync(
            "./data/giveaways.json",
            JSON.stringify(giveaway_list, null, "\t")
          );

          await interaction.message.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle(interaction.message.embeds[0].data.title)
                .setColor(interaction.message.embeds[0].data.color)
                .setDescription(interaction.message.embeds[0].data.description)
                .setFooter({
                  text: `${giveaway_list.current[i].users.length} participants`,
                }),
            ],
          });

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Blue")
                .setDescription(
                  "<:BB_Check:1031690264089202698> ┊ You have successfully left this giveaway."
                ),
            ],
            ephemeral: true,
          });
        }

        if (giveaway_list.current[i].owner == interaction.user.id)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You cannot join your own giveaway."
                ),
            ],
            ephemeral: true,
          });

        if (
          giveaway_list.current[i].role !== "none" &&
          !interaction.member.roles.cache.get(giveaway_list.current[i].role)
        )
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  `<:BB_Cross:1031690265334911086> ┊ You are missing the <@&${giveaway_list.current[i].role}> role.`
                ),
            ],
            ephemeral: true,
          });

        let link_data = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
        if (!link_data)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You can only join this giveaway if you are linked to the bot."
                ),
            ],
            ephemeral: true,
          });
        let link = link_data.SMMO_ID;

        giveaway_list.current[i].users.push({
          id: interaction.user.id,
          link: link,
        });
        fs.writeFileSync(
          "./data/giveaways.json",
          JSON.stringify(giveaway_list, null, "\t")
        );

        await interaction.message.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(interaction.message.embeds[0].data.title)
              .setColor(interaction.message.embeds[0].data.color)
              .setDescription(interaction.message.embeds[0].data.description)
              .setFooter({
                text: `${giveaway_list.current[i].users.length} participants`,
              }),
          ],
        });

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setDescription(
                "<:BB_Check:1031690264089202698> ┊  You have successfully joined this giveaway."
              ),
          ],
          ephemeral: true,
        });
      }
      console.log("Join Giveaway Request Digested");
    }
    if (interaction.customId === "end_giveaway") {
      for (let i = 0; i < giveaway_list.current.length; i++) {
        if (interaction.message.id !== giveaway_list.current[i].msg.id)
          continue;

        if (giveaway_list.current[i].owner != interaction.user.id)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊  You are not the owner of this giveaway."
                ),
            ],
            ephemeral: true,
          });

        let verify_embed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `Are you sure you would like to end the giveaway \`${interaction.message.embeds[0].data.title.replace(
              "<:BB_Quests:1027227608267636816> ┊ ",
              ""
            )}\`?`
          );

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("verify")
            .setStyle(ButtonStyle.Success)
            .setEmoji("<:BB_Check:1031690264089202698>"),
          new ButtonBuilder()
            .setCustomId("deny")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:BB_Cross:1031690265334911086>")
        );
        interaction
          .reply({ embeds: [verify_embed], components: [row], ephemeral: true })
          .then(async () => {
            const listener = async (int) => {
              if (int.customId === "verify") {
                let giveaway_data = db_gen
                  .prepare(`SELECT * FROM giveaways WHERE id=?`)
                  .get(giveaway_list.current[i].index);
                if (!giveaway_data) return console.log("an error occurred");

                let winners = [];
                let userlist = Array.from(giveaway_list.current[i].users);
                let amount = userlist.length;
                for (let j = 0; j < giveaway_data.winners; j++) {
                  if (!userlist[0]) continue;

                  let pick = randomPick(userlist);
                  userlist.splice(userlist.indexOf(pick), 1);
                  winners.push(pick);
                }

                let winnerlist = "";
                let ping = "";
                for (let j = 0; j < winners.length; j++) {
                  if (!winners[j]) continue;

                  ping += `<@${winners[j].id}>, `;
                  winnerlist += `${j + 1}. <@${
                    winners[j].id
                  }> - [[Profile]](https://simplemmo.me/mobile/?page=user/view/${
                    winners[j].link
                  })\n`;
                }

                let channel = await client.channels.fetch(
                  giveaway_list.current[i].msg.channel
                );
                if (!channel) return console.log("an error occurred");
                let msg = await channel.messages.fetch(
                  giveaway_list.current[i].msg.id
                );
                if (!msg) return console.log("an error occurred");

                await msg
                  .edit({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(msg.embeds[0].data.title)
                        .setColor(msg.embeds[0].data.color)
                        .setDescription(
                          msg.embeds[0].data.description.replace(
                            "Ends",
                            "Ended"
                          )
                        )
                        .setFooter({ text: `${amount} participants` }),
                    ],
                    components: [
                      new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                          .setCustomId(`reroll_giveaway`)
                          .setStyle(ButtonStyle.Primary)
                          .setLabel("Reroll")
                      ),
                    ],
                  })
                  .catch((e) => {
                    console.log(e);
                  });

                if (winnerlist !== "") {
                  channel.send({
                    content: `Congratulations to ${ping.slice(0, -2)}!`,
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(
                          `🎊 GIVEAWAY #${giveaway_list.current[i].index} ENDED 🎊`
                        )
                        .setColor("#e76f51")
                        .setDescription(
                          `\uFEFF\n**Prize: ${giveaway_data.type}**\n\n**Winners:**\n${winnerlist}`
                        ),
                    ],
                  });
                }

                let cmd = db_gen.prepare(
                  `UPDATE giveaways SET active=0 WHERE id=?`
                );
                cmd.run(giveaway_data.id);

                giveaway_list.past.push(giveaway_list.current[i]);
                giveaway_list.current.splice(i, 1);
                fs.writeFileSync(
                  "./data/giveaways.json",
                  JSON.stringify(giveaway_list, null, "\t")
                );

                var confirmembed = new EmbedBuilder()
                  .setColor("Green")
                  .setDescription(`The giveaway has been ended.`);

                client.off("interactionCreate", listener);
                return int.reply({ embeds: [confirmembed], ephemeral: true });
              }
              if (int.customId === "deny") {
                interaction
                  .editReply({ embeds: [verify_embed], components: [] })
                  .catch((e) => {
                    console.log(e);
                  });

                var denyembed = new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(`The giveaway will remain active.`);

                client.off("interactionCreate", listener);
                return int.reply({ embeds: [denyembed], ephemeral: true });
              }
            };
            client.on("interactionCreate", listener);
          })
          .catch((e) => {
            console.log(e);
          });
      }
    }
    if (interaction.customId === "reroll_giveaway") {
      for (let i = 0; i < giveaway_list.past.length; i++) {
        let giveaway_data = db_gen
          .prepare(`SELECT * FROM giveaways WHERE id=?`)
          .get(giveaway_list.past[i].index);
        if (interaction.message.id !== giveaway_list.past[i].msg.id) continue;

        if (giveaway_list.past[i].owner != interaction.user.id)
          return interaction.deferUpdate();

        if (giveaway_list.past[i].users.length < 1)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊  There are not enough users to reroll."
                ),
            ],
            ephemeral: true,
          });

        let winners = [];
        let userlist = giveaway_list.past[i].users;
        let amount = userlist.length;
        for (let j = 0; j < giveaway_data.winners; j++) {
          if (!userlist[0]) continue;

          let pick = randomPick(userlist);
          userlist.splice(userlist.indexOf(pick), 1);
          winners.push(pick);
        }

        let winnerlist = "";
        let ping = "";
        for (let j = 0; j < winners.length; j++) {
          if (!winners[j]) continue;

          ping += `<@${winners[j].id}>, `;
          winnerlist += `${j + 1}. <@${
            winners[j].id
          }> - [[Profile]](https://simplemmo.me/mobile/?page=user/view/${
            winners[j].link
          })\n`;
        }

        let channel = await client.channels.fetch(
          giveaway_list.past[i].msg.channel
        );
        if (!channel) return console.log("an error occurred");
        let msg = await channel.messages.fetch(giveaway_list.past[i].msg.id);
        if (!msg) return console.log("an error occurred");

        await msg
          .edit({
            embeds: [
              new EmbedBuilder()
                .setTitle(msg.embeds[0].data.title)
                .setColor(msg.embeds[0].data.color)
                .setDescription(
                  msg.embeds[0].data.description.replace("Ends", "Ended")
                )
                .setFooter({ text: `${amount} participants` }),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`reroll_giveaway`)
                  .setStyle(ButtonStyle.Primary)
                  .setLabel("Reroll")
              ),
            ],
          })
          .catch((e) => {
            console.log(e);
          });

        if (winnerlist !== "") {
          channel.send({
            content: `Congratulations to ${ping.slice(0, -2)}!`,
            embeds: [
              new EmbedBuilder()
                .setTitle(`🎊 GIVEAWAY #${giveaway_data.id + 1} REROLLED! 🎊`)
                .setColor("#f4a261")
                .setDescription(
                  `**Prize: ${giveaway_data.type}**\n\n**New Winners:**\n${winnerlist}`
                ),
            ],
          });
        }
        return interaction.reply({
          content: "Successfully rerolled your giveaway.",
          ephemeral: true,
        });
      }
    }

    let comp_data = JSON.parse(fs.readFileSync("./data/competitions.json"));
    if (interaction.customId === "join_competition") {
      for (let i = 0; i < comp_data.length; i++) {
        if (interaction.message.id !== comp_data[i].msg.id) continue;

        for (let j = 0; j < comp_data[i].members.length; j++) {
          if (comp_data[i].members[j].id !== interaction.user.id) continue;

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You are already part of this competition."
                ),
            ],
            ephemeral: true,
          });
        }

        if (comp_data[i].role !== "none") {
          if (
            !interaction.member.roles.cache.find(
              (r) => r.id === comp_data[i].role.id
            )
          )
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(
                    `<:BB_Cross:1031690265334911086> ┊ You cannot join this competition.\n<:blank:1019977634249187368> ┊ You do not have the role <@&${comp_data[i].role.id}>`
                  ),
              ],
              ephemeral: true,
            });
        }

        let link_data = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
        if (!link_data)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You are not linked. Run /gverify to link your account."
                ),
            ],
            ephemeral: true,
          });
        let link = link_data.SMMO_ID;

        let data = db_ud
          .prepare(`SELECT * FROM ${comp_data[i].database} WHERE id=?`)
          .get(link);
        if (!data) {
          let data_now = db_ud
            .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
            .get(link);
          if (!data_now)
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(
                    "<:BB_Cross:1031690265334911086> ┊ There has been an error with the database. Please contact n3xistence#0003 for help."
                  ),
              ],
              ephemeral: true,
            });

          let cmd = db_ud.prepare(
            `INSERT INTO ${comp_data[i].database} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );
          cmd.run(
            data_now.id,
            data_now.name,
            data_now.level,
            data_now.steps,
            data_now.npc,
            data_now.pvp,
            data_now.quests,
            data_now.tasks,
            data_now.bosses,
            data_now.bounties,
            data_now.safemode,
            data_now.location_name,
            data_now.location_id,
            data_now.guild_id
          );
        } else {
          let user_data = db_ud
            .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
            .get(link);
          let payload = [
            user_data.id,
            user_data.name,
            user_data.level,
            user_data.steps,
            user_data.npc,
            user_data.pvp,
            user_data.quests,
            user_data.tasks,
            user_data.bosses,
            user_data.bounties,
            user_data.safemode,
            user_data.location_name,
            user_data.location_id,
            user_data.guild_id,
          ];

          let cmd = db_ud.prepare(
            `UPDATE ${comp_data[i].database} SET id=?, name=?, level=?, steps=?, npc=?, pvp=?, quests=?, tasks=?, bosses=?, bounties=?, safemode=?, location_name=?, location_id=?, guild_id=? WHERE id=?`
          );
          cmd.run(...payload, link);
        }

        comp_data[i].members.push({
          id: interaction.user.id,
          name: interaction.user.username,
        });
        fs.writeFileSync(
          `./data/competitions.json`,
          JSON.stringify(comp_data, null, "\t")
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setDescription(
                "<:BB_Check:1031690264089202698> ┊  You have successfully joined this competition."
              ),
          ],
          ephemeral: true,
        });
      }
    }
    if (interaction.customId === "check_competition_stats") {
      for (let i = 0; i < comp_data.length; i++) {
        if (interaction.message.id !== comp_data[i].msg.id) continue;

        let has_joined = false;
        for (let k = 0; k < comp_data[i].members.length; k++) {
          if (comp_data[i].members[k].id === interaction.user.id)
            has_joined = true;
        }
        if (!has_joined)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You are not part of this competition.\n<:blank:1019977634249187368> ┊ Press the 'Join' button to participate."
                ),
            ],
            ephemeral: true,
          });

        let link_data = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
        if (!link_data)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You are not linked. Run /gverify to link your account."
                ),
            ],
            ephemeral: true,
          });
        let link = link_data.SMMO_ID;

        let data_then = db_ud
          .prepare(`SELECT * FROM ${comp_data[i].database} WHERE id=?`)
          .get(link);
        let data_now = db_ud
          .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
          .get(link);
        if (!data_now || !data_then)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ You have no corresponding database entry."
                ),
            ],
            ephemeral: true,
          });

        let progress = 0;
        let response = "";
        let color = "";
        switch (comp_data[i].type) {
          case "npc":
            progress = data_now.npc - data_then.npc;
            response += `<:BB_NPC:1027227605650391102> ┊ You have gathered ${progress} ${comp_data[i].type} kills since the beginning of the competition.`;
            color = "Green";
            break;
          case "pvp":
            progress = data_now.pvp - data_then.pvp;
            response += `<:BB_PVP:1027227607034515456> ┊ You have gathered ${progress} ${comp_data[i].type} kills since the beginning of the competition.`;
            color = "Red";
            break;
          case "steps":
            progress = data_now.steps - data_then.steps;
            response += `<:BB_Steps:1027227609723047966> ┊ You have gathered ${progress} ${comp_data[i].type} since the beginning of the competition.`;
            color = "Orange";
            break;
          default:
            return interaction.reply({
              content: "Some error occurred.",
              ephemeral: true,
            });
        }
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(color).setDescription(response)],
          ephemeral: true,
        });
      }
    }
    if (interaction.customId === "end_competition") {
      for (let i = 0; i < comp_data.length; i++) {
        if (interaction.message.id !== comp_data[i].msg.id) continue;

        let hasperms = interaction.member.permissions.has("ManageGuild");
        if (interaction.user.id !== "189764769312407552" && !hasperms)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  "<:BB_Cross:1031690265334911086> ┊ This button ends the competition and is only usable by moderators."
                ),
            ],
            ephemeral: true,
          });

        let verify_embed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `Are you sure you would like to end the competition \`${interaction.message.embeds[0].data.title
              .replace("<:BB_Steps:1027227609723047966> ┊ ", "")
              .replace("<:BB_PVP:1027227607034515456> ┊ ", "")
              .replace("<:BB_NPC:1027227605650391102> ┊ ", "")}\`?`
          );

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("verify")
            .setStyle(ButtonStyle.Success)
            .setEmoji("<:BB_Check:1031690264089202698>"),
          new ButtonBuilder()
            .setCustomId("deny")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:BB_Cross:1031690265334911086>")
        );
        interaction
          .reply({ embeds: [verify_embed], components: [row], ephemeral: true })
          .then(() => {
            const listener = async (int) => {
              if (int.customId === "verify") {
                await interaction.message
                  .edit({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(interaction.message.embeds[0].data.title)
                        .setColor(interaction.message.embeds[0].data.color)
                        .setDescription(
                          interaction.message.embeds[0].data.description
                        )
                        .addFields(interaction.message.embeds[0].data.fields[0])
                        .setFooter(interaction.message.embeds[0].data.footer),
                    ],
                    components: [],
                  })
                  .catch((e) => {
                    console.log(e);
                  });

                let user_list = [];
                for (let k = 0; k < comp_data[i].members.length; k++) {
                  let link_data = db_gen
                    .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
                    .get(comp_data[i].members[k].id);
                  if (!link_data) continue;
                  let link = link_data.SMMO_ID;

                  let data_then = db_ud
                    .prepare(
                      `SELECT * FROM ${comp_data[i].database} WHERE id=?`
                    )
                    .get(link);
                  let data_now = db_ud
                    .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
                    .get(link);
                  if (!data_now || !data_then) continue;

                  let progress = 0;
                  switch (comp_data[i].type) {
                    case "npc":
                      progress = data_now.npc - data_then.npc;
                      break;
                    case "pvp":
                      progress = data_now.pvp - data_then.pvp;
                      break;
                    case "steps":
                      progress = data_now.steps - data_then.steps;
                      break;
                    default:
                      return interaction.reply({
                        content: "Some error occurred.",
                        ephemeral: true,
                      });
                  }
                  user_list.push([comp_data[i].members[k].id, link, progress]);
                }

                function sortFunction(a, b) {
                  if (a[2] === b[2]) {
                    return 0;
                  } else {
                    return a[2] > b[2] ? -1 : 1;
                  }
                }

                user_list.sort(sortFunction);

                let ping_msg = "";
                for (let i = 0; i < 5; i++) {
                  if (!user_list[i]) continue;

                  ping_msg += `<@${user_list[i][0]}>\n`;
                }

                if (ping_msg)
                  interaction.channel.send({
                    content: `Congratulations on placing top 5: \n${ping_msg}`,
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(interaction.message.embeds[0].data.title)
                        .setColor(interaction.message.embeds[0].data.color)
                        .setDescription(
                          interaction.message.embeds[0].data.description
                        )
                        .addFields(interaction.message.embeds[0].data.fields[0])
                        .setFooter(interaction.message.embeds[0].data.footer),
                    ],
                  });

                let msg = await interaction.channel.messages.fetch(
                  comp_data[i].msg.id
                );
                if (msg) await msg.delete().catch(console.log);

                db_ud
                  .prepare(`DROP TABLE IF EXISTS ${comp_data[i].database}`)
                  .run();

                comp_data.splice(i, 1);
                fs.writeFileSync(
                  `./data/competitions.json`,
                  JSON.stringify(comp_data, null, "\t")
                );

                interaction
                  .editReply({ embeds: [verify_embed], components: [] })
                  .catch((e) => {
                    console.log(e);
                  });

                var verifyembed = new EmbedBuilder()
                  .setColor("Green")
                  .setDescription(`The competition has been ended.`);

                client.off("interactionCreate", listener);
                return int.reply({ embeds: [verifyembed], ephemeral: true });
              }

              //deny reaction
              if (int.customId === "deny") {
                interaction
                  .editReply({ embeds: [verify_embed], components: [] })
                  .catch((e) => {
                    console.log(e);
                  });

                var denyembed = new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(`The competition will remain active.`);

                client.off("interactionCreate", listener);
                return int.reply({ embeds: [denyembed], ephemeral: true });
              }
            };
            client.on("interactionCreate", listener);
          });
      }
    }

    //handle guildie sm embed
    let msg_data = JSON.parse(
      fs.readFileSync("./data/attackable_guildies.json")
    );
    if (
      interaction.customId === "refresh_guildies" &&
      interaction.message.id == msg_data.msg_id
    ) {
      let guildID = config.guilds[0].id;
      let guilddata = "";

      let url = `https://api.simple-mmo.com/v1/guilds/members/${guildID}`;

      let guildnameurl = `https://api.simple-mmo.com/v1/guilds/info/${guildID}`;
      var api_key = getAPI_Key();
      if (api_key != null) {
        async function getUserData() {
          try {
            return await axios.post(guildnameurl, { api_key: api_key });
          } catch (err) {
            console.log(
              "\x1B[3;33m[x] - error with the SMMO api (code 01_EMBD_SM)\x1B[0m\n" +
                err
            );
            return null;
          }
        }
        getUserData().then((response) => {
          guilddata = response.data;
        });
      }

      var api_key = getAPI_Key();
      if (api_key === null) return null;

      async function getUserData() {
        try {
          return await axios.post(url, { api_key: api_key });
        } catch (err) {
          console.log(
            "\x1B[3;33m[x] - error with the SMMO api (code 01_EMBD_SM)\x1B[0m\n" +
              err
          );
          return null;
        }
      }

      var userList = [];

      getUserData().then((response) => {
        if (response === null) return null;
        var user_data = response.data;
        user_data.forEach((gMember) => {
          if (gMember.safe_mode == 0)
            userList.push([
              gMember.name,
              gMember.user_id,
              gMember.last_activity,
              gMember.safe_mode,
              gMember.level,
              gMember.current_hp,
              gMember.max_hp,
            ]);
        });

        let attackable_list = [];
        let dead_list = [];
        for (let i = 0; i < userList.length; i++) {
          if (userList[i][5] / userList[i][6] >= 0.5) {
            attackable_list.push(userList[i]);
          } else {
            dead_list.push(userList[i]);
          }
        }

        if (!userList[0]) return null;

        function sortFunction(a, b) {
          if (a[4] === b[4]) {
            return 0;
          } else {
            return a[4] < b[4] ? -1 : 1;
          }
        }
        attackable_list.sort(sortFunction);
        dead_list.sort(sortFunction);

        let attackableString = "";
        for (var k = 0; k < attackable_list.length; k++) {
          if (attackableString.length < 3800) {
            if (attackable_list[k][3] == 0) {
              let userHP = `${(
                (attackable_list[k][5] / attackable_list[k][6]).toFixed(3) * 100
              )
                .toString()
                .substring(0, 4)}%`;
              attackableString += `[[${attackable_list[k][0]}]](https://web.simple-mmo.com/user/view/${attackable_list[k][1]}) - LVL: ${attackable_list[k][4]} - HP ${userHP}\n`;
            }
          }
        }

        let deadString = "";
        for (var k = 0; k < dead_list.length; k++) {
          if (deadString.length < 850) {
            if (dead_list[k][3] == 0) {
              let userHP = `${(
                (dead_list[k][5] / dead_list[k][6]).toFixed(3) * 100
              )
                .toString()
                .substring(0, 4)}%`;
              deadString += `[[${dead_list[k][0]}]](https://web.simple-mmo.com/user/view/${dead_list[k][1]}) - lvl ${dead_list[k][4]} - HP ${userHP}\n`;
            }
          }
        }
        if (attackableString.length > 4096 || deadString.length > 1024) return;

        let channel = client.channels.cache.get(
          config.server.channels.focuswars
        );
        channel.messages.fetch(msg_data.msg_id).then((msg) => {
          var embed = new EmbedBuilder()
            .setColor("#2f3136")
            .setThumbnail(
              `https://web.simple-mmo.com/img/icons/${guilddata.icon}`
            )
            .setTitle(`Attackable Guildies`)
            .setDescription(
              `${attackableString.length > 0 ? attackableString : "None"}`
            )
            .addFields({
              name: "Not Attackable Yet",
              value: `${deadString.length > 0 ? deadString : "None"}`,
            })
            .setFooter({ text: `Last updated` })
            .setTimestamp();
          msg.edit({ embeds: [embed] });
          return interaction.deferUpdate();
        });
      });
    }
    //end of guildie embed

    //HANDLE QUESTS
    //reset the progress bar
    progressBar = "";

    let quests = db_gen.prepare(`SELECT * FROM quests`).all();

    let idList = [
      quests[0].msg_id,
      quests[1].msg_id,
      quests[2].msg_id,
      quests[3].msg_id,
      quests[4].msg_id,
    ];

    //quest 1 check
    if (interaction.message.id == idList[0]) {
      if (
        interaction.customId === "quest_1" &&
        checkEligibility(interaction.user.id, 1) &&
        !hasCompleted(interaction.user.id, 1)
      ) {
        awardPoints(interaction.user, 1);

        weeklyCheck(interaction.user.id, 1);
        updateQuestCompletion(1);
        return interaction
          .reply({
            content: "You received 2 points for completing quest 1.",
            ephemeral: true,
          })
          .catch(console.log);
      } else {
        //error handling
        if (hasCompleted(interaction.user.id, 1))
          return interaction
            .reply({
              content:
                "You have already completed quest 1 for the week, look at the other quests or return next week for more rewards.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userIsLinked)
          return interaction
            .reply({
              content:
                "Your account is currently not linked. Use `/gverify` to link your SMMO id to your discord account.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userHasDBEntry)
          return interaction
            .reply({
              content:
                "Your account has no corresponding entry in the database. If you think this is a mistake, contact n3xistence#0003",
              ephemeral: true,
            })
            .catch(console.log);
        if (errorWildcard)
          return interaction
            .reply({
              content: "Some error occured. Message n3xistence#0003 for help.",
              ephemeral: true,
            })
            .catch(console.log);

        return interaction
          .reply({
            content:
              "You do not meet the requirement:\n" +
              (nowValue - thenValue) +
              "/" +
              rawData +
              " " +
              questType +
              " completed. (" +
              +(((nowValue - thenValue) / rawData) * 100).toFixed(2) +
              "%)\n" +
              progressBar,
            ephemeral: true,
          })
          .catch(console.log);
      }
    }

    //quest 2 check
    if (interaction.message.id == idList[1]) {
      if (
        interaction.customId === "quest_2" &&
        checkEligibility(interaction.user.id, 2) &&
        !hasCompleted(interaction.user.id, 2)
      ) {
        awardPoints(interaction.user, 2);

        weeklyCheck(interaction.user.id, 2);
        updateQuestCompletion(2);
        return interaction
          .reply({
            content: "You received 2 points for completing quest 2.",
            ephemeral: true,
          })
          .catch(console.log);
      } else {
        //error handling
        if (hasCompleted(interaction.user.id, 2))
          return interaction
            .reply({
              content:
                "You have already completed quest 2 for the week, look at the other quests or return next week for more rewards.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userIsLinked)
          return interaction
            .reply({
              content:
                "Your account is currently not linked. Use `/gverify` to link your SMMO id to your discord account.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userHasDBEntry)
          return interaction
            .reply({
              content:
                "Your account has no corresponding entry in the database. If you think this is a mistake, contact n3xistence#0003",
              ephemeral: true,
            })
            .catch(console.log);
        if (errorWildcard)
          return interaction
            .reply({
              content: "Some error occured. Message n3xistence#0003 for help.",
              ephemeral: true,
            })
            .catch(console.log);

        return interaction
          .reply({
            content:
              "You do not meet the requirement:\n" +
              (nowValue - thenValue) +
              "/" +
              rawData +
              " " +
              questType +
              " completed. (" +
              +(((nowValue - thenValue) / rawData) * 100).toFixed(2) +
              "%)\n" +
              progressBar,
            ephemeral: true,
          })
          .catch(console.log);
      }
    }

    //quest 3 check
    if (interaction.message.id == idList[2]) {
      if (
        interaction.customId === "quest_3" &&
        checkEligibility(interaction.user.id, 3) &&
        !hasCompleted(interaction.user.id, 3)
      ) {
        awardPoints(interaction.user, 3);

        weeklyCheck(interaction.user.id, 3);
        updateQuestCompletion(3);
        return interaction
          .reply({
            content: "You received 2 points for completing quest 3.",
            ephemeral: true,
          })
          .catch(console.log);
      } else {
        //error handling
        if (hasCompleted(interaction.user.id, 3))
          return interaction
            .reply({
              content:
                "You have already completed quest 3 for the week, look at the other quests or return next week for more rewards.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userIsLinked)
          return interaction
            .reply({
              content:
                "Your account is currently not linked. Use `/gverify` to link your SMMO id to your discord account.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userHasDBEntry)
          return interaction
            .reply({
              content:
                "Your account has no corresponding entry in the database. If you think this is a mistake, contact n3xistence#0003",
              ephemeral: true,
            })
            .catch(console.log);
        if (errorWildcard)
          return interaction
            .reply({
              content: "Some error occured. Message n3xistence#0003 for help.",
              ephemeral: true,
            })
            .catch(console.log);

        return interaction
          .reply({
            content:
              "You do not meet the requirement:\n" +
              (nowValue - thenValue) +
              "/" +
              rawData +
              " " +
              questType +
              " completed. (" +
              +(((nowValue - thenValue) / rawData) * 100).toFixed(2) +
              "%)\n" +
              progressBar,
            ephemeral: true,
          })
          .catch(console.log);
      }
    }

    //quest 4 check
    if (interaction.message.id == idList[3]) {
      if (
        interaction.customId === "quest_4" &&
        checkEligibility(interaction.user.id, 4) &&
        !hasCompleted(interaction.user.id, 4)
      ) {
        awardPoints(interaction.user, 4);

        weeklyCheck(interaction.user.id, 4);
        updateQuestCompletion(4);
        return interaction
          .reply({
            content: "You received 2 points for completing quest 4.",
            ephemeral: true,
          })
          .catch(console.log);
      } else {
        //error handling
        if (hasCompleted(interaction.user.id, 4))
          return interaction
            .reply({
              content:
                "You have already completed quest 4 for the week, look at the other quests or return next week for more rewards.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userIsLinked)
          return interaction
            .reply({
              content:
                "Your account is currently not linked. Use `/gverify` to link your SMMO id to your discord account.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userHasDBEntry)
          return interaction
            .reply({
              content:
                "Your account has no corresponding entry in the database. If you think this is a mistake, contact n3xistence#0003",
              ephemeral: true,
            })
            .catch(console.log);
        if (errorWildcard)
          return interaction
            .reply({
              content: "Some error occured. Message n3xistence#0003 for help.",
              ephemeral: true,
            })
            .catch(console.log);

        return interaction
          .reply({
            content:
              "You do not meet the requirement:\n" +
              (nowValue - thenValue) +
              "/" +
              rawData +
              " " +
              questType +
              " completed. (" +
              +(((nowValue - thenValue) / rawData) * 100).toFixed(2) +
              "%)\n" +
              progressBar,
            ephemeral: true,
          })
          .catch(console.log);
      }
    }

    //quest 5 check
    if (interaction.message.id == idList[4]) {
      if (
        interaction.customId === "quest_5" &&
        checkEligibility(interaction.user.id, 5) &&
        !hasCompleted(interaction.user.id, 5)
      ) {
        awardPoints(interaction.user, 5);

        weeklyCheck(interaction.user.id, 5);
        updateQuestCompletion(5);
        return interaction
          .reply({
            content: "You received 2 points for completing quest 5.",
            ephemeral: true,
          })
          .catch(console.log);
      } else {
        //error handling
        if (hasCompleted(interaction.user.id, 5))
          return interaction
            .reply({
              content:
                "You have already completed quest 5 for the week, look at the other quests or return next week for more rewards.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userIsLinked)
          return interaction
            .reply({
              content:
                "Your account is currently not linked. Use `/gverify` to link your SMMO id to your discord account.",
              ephemeral: true,
            })
            .catch(console.log);
        if (!userHasDBEntry)
          return interaction
            .reply({
              content:
                "Your account has no corresponding entry in the database. If you think this is a mistake, contact n3xistence#0003",
              ephemeral: true,
            })
            .catch(console.log);
        if (errorWildcard)
          return interaction
            .reply({
              content: "Some error occured. Message n3xistence#0003 for help.",
              ephemeral: true,
            })
            .catch(console.log);

        return interaction
          .reply({
            content:
              "You do not meet the requirement:\n" +
              (nowValue - thenValue) +
              "/" +
              rawData +
              " " +
              questType +
              " completed. (" +
              +(((nowValue - thenValue) / rawData) * 100).toFixed(2) +
              "%)\n" +
              progressBar,
            ephemeral: true,
          })
          .catch(console.log);
      }
    }
    //end of quests

    //raid boss
    let boss = JSON.parse(fs.readFileSync("./data/boss_data.json"));
    let boss_channel = config.server.channels.raidboss;
    boss_channel = client.channels.cache.get(boss_channel);
    if (
      interaction.customId === "attack_boss" &&
      interaction.message.id == boss.id &&
      boss_channel &&
      boss.name
    ) {
      if (config.server.channels.data === "undefined")
        return console.log("Data Channel is not set up properly.");

      let boss = JSON.parse(fs.readFileSync("./data/boss_data.json"));
      let msg = await boss_channel.messages.fetch(boss.id).catch(console.log);

      //get user link
      try {
        var link = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
      } catch {
        return interaction
          .reply({
            content: `There has been an error with the database.`,
            ephemeral: true,
          })
          .catch(console.log);
      }
      if (!link)
        return interaction
          .reply({
            content: `You are unlinked. Use /gverify to link your account.`,
            ephemeral: true,
          })
          .catch(console.log);

      try {
        var data_then = db_ud
          .prepare(`SELECT * FROM BossUserData WHERE id=?`)
          .get(link.SMMO_ID);
      } catch (error) {
        console.log(error);
        return interaction
          .reply({
            content: "There has been an issue with the BossFight Database.",
            ephemeral: true,
          })
          .catch(console.log);
      }

      try {
        var data_now = db_ud
          .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
          .get(link.SMMO_ID);
      } catch (e) {
        console.log(e);
        return interaction
          .reply({
            content: "There has been an issue with the Live database.",
            ephemeral: true,
          })
          .catch(console.log);
      }

      //got user data
      let steps = data_now.steps - data_then.steps;
      let NPC = data_now.npc - data_then.npc;
      let PVP = data_now.pvp - data_then.pvp;
      let quests = data_now.quests - data_then.quests;

      let damage = Math.floor(
        5000 *
          (1 -
            Math.pow(
              Math.E,
              -(1 / 4500) *
                (steps * (1 + (0.15 * NPC + 0.2 * PVP + 0.1 * quests)))
            )) *
          1.1
      );

      if (damage > 0) {
        let leaderboards = JSON.parse(fs.readFileSync("./data/boss_LB.json"));
        let exists = false;
        for (let i = 0; i < leaderboards.length; i++) {
          if (leaderboards[i].id === interaction.user.id) {
            leaderboards[i].damage = parseInt(leaderboards[i].damage) + damage;
            exists = true;
            i = leaderboards.length;
          }
        }
        if (!exists) {
          leaderboards.push({
            id: interaction.user.id,
            damage: damage,
          });
        }
        fs.writeFileSync("./data/boss_LB.json", JSON.stringify(leaderboards));

        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  `<:BB_PVP:1027227607034515456> ┊ You have dealt ${damage} damage to the boss!`
                ),
            ],
            ephemeral: true,
          })
          .catch(console.log);

        hp = parseInt(boss.hp) - damage;
        //on death
        if (hp <= 0) {
          let endEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle(boss.name)
            .setThumbnail(
              "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI"
            )
            .setFields({
              name: "HP:",
              value: `[<:BB_Cross:1031690265334911086>] DEAD`,
            });

          let leaderboards = JSON.parse(fs.readFileSync("./data/boss_LB.json"));

          //display the leaderboards
          let LB_string = "";
          function sortFunction(a, b) {
            if (a.damage === b.damage) return 0;
            else return a.damage > b.damage ? -1 : 1;
          }

          let overall_damage = 0;
          for (let i = 0; i < leaderboards.length; i++) {
            overall_damage += parseInt(leaderboards[i].damage);
          }

          leaderboards.sort(sortFunction);

          //add rewards
          for (let i = 0; i < 5; i++) {
            if (!leaderboards[i]) continue;

            switch (i + 1) {
              case 1:
                var reward = 5;
                break;
              case 2:
                var reward = 4;
                break;
              case 3:
                var reward = 3;
                break;
              case 4:
                var reward = 2;
                break;
              case 5:
                var reward = 1;
                break;
              default:
                continue;
            }

            let current_points = db_gen
              .prepare(`SELECT * FROM points WHERE id=?`)
              .get(leaderboards[i].id);

            if (current_points) {
              let new_points = current_points.points + reward;

              let cmd = db_gen.prepare(
                `UPDATE points SET points = ? WHERE id = ?`
              );
              try {
                cmd.run(new_points, leaderboards[i].id);
              } catch {
                data_channel.send({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(`Red`)
                      .setDescription(
                        `<:BB_Cross:1031690265334911086> There was an error adding ${reward} points to <@${leaderboards[i].id}>`
                      ),
                  ],
                });
              }
            } else {
              let user = await client.users.fetch(leaderboards[i].id);
              if (!user) {
                data_channel.send({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(`Red`)
                      .setDescription(
                        `<:BB_Cross:1031690265334911086> Error retrieving <@${leaderboards[i].id}>. Could not add ${reward} points.`
                      ),
                  ],
                });
              } else {
                try {
                  let cmd = db_gen.prepare(
                    `INSERT INTO points VALUES (?, ?, ?)`
                  );
                  cmd.run(user.id, user.username, reward);
                } catch {
                  data_channel.send({
                    embeds: [
                      new EmbedBuilder()
                        .setColor(`Red`)
                        .setDescription(
                          `<:BB_Cross:1031690265334911086> There was an error adding ${reward} points to <@${leaderboards[i].id}>`
                        ),
                    ],
                  });
                }
              }
            }
          }

          //create lb string (top 5)
          for (let i = 0; i < 5; i++) {
            if (!leaderboards[i]) continue;
            LB_string += `${i + 1}. <@${leaderboards[i].id}> - ${
              leaderboards[i].damage
            } dmg (${(
              (leaderboards[i].damage / overall_damage).toFixed(3) * 100
            )
              .toString()
              .substring(0, 4)}%)\n`;
          }

          //send the victory embed
          let data_channel = client.channels.cache.get(
            config.server.channels.data
          );
          if (LB_string.length > 4096) {
            data_channel.send(
              `__**${boss.name} has been vanquished!**__\n${LB_string}`
            );
          } else {
            let LB_embed = new EmbedBuilder()
              .setColor("Green")
              .setTitle(`${boss.name} has been vanquished!`)
              .setDescription(LB_string);
            data_channel.send({ embeds: [LB_embed] });
          }

          //clear the boss data
          delete boss.name;
          delete boss.hp;
          delete boss.max_hp;
          delete boss.id;
          fs.writeFileSync("./data/boss_data.json", JSON.stringify(boss));

          //edit the boss embed
          return msg
            .edit({ embeds: [endEmbed], components: [] })
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              }, 3600000);

              //spawn new boss after interval
              setTimeout(() => {
                spawnRaidBoss();
              }, 86400000); //12h
            })
            .catch((e) => {
              console.log(e);
            });
        }

        let data = {
          name: boss.name,
          hp: hp,
          max_hp: boss.max_hp,
          id: msg.id,
        };
        fs.writeFileSync("./data/boss_data.json", JSON.stringify(data));

        let HP_bar = "";
        var z = (hp / boss.max_hp) * 100;

        //create the progress bar
        for (var i = 0; i < 100; i += 10) {
          if (z - 10 >= 0) {
            HP_bar += "▰";
            z -= 10;
          } else {
            HP_bar += "▱";
          }
        }

        let newEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle(boss.name)
          .setThumbnail(
            "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI"
          )
          .setFields({
            name: "HP:",
            value: `${hp} / ${boss.max_hp}\n${HP_bar}`,
          });
        msg.edit({ embeds: [newEmbed] });

        try {
          let cmd = db_ud.prepare(
            `UPDATE BossUserData SET steps=?, npc=?, pvp=?, quests=? WHERE id=?`
          );
          cmd.run(
            data_now.steps,
            data_now.npc,
            data_now.pvp,
            data_now.quests,
            link.SMMO_ID
          );
        } catch {
          console.log(
            `There was an issue updating ${interaction.user.username}'s Boss Database Entry. Please contact n3xistence#0003.`
          );
        }
      } else {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  `<:BB_PVP:1027227607034515456> ┊ In a grand gesture, you wind up your attack and...\nmiss.. How embarrassing.`
                ),
            ],
            ephemeral: true,
          })
          .catch(console.log);
      }
    }
    if (interaction.customId === "check_boss_dmg") {
      function roundToHour(date) {
        let p = 60 * 60 * 1000; // milliseconds in an hour
        return new Date(Math.ceil(date.getTime() / p) * p) / 1000;
      }

      //get user link
      let link_data = db_gen
        .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
        .get(interaction.user.id);
      if (!link_data)
        return interaction.reply({
          content: `You are unlinked. Use /gverify to link your account.`,
          ephemeral: true,
        });
      let link = link_data.SMMO_ID;

      try {
        var data_then = db_ud
          .prepare(`SELECT * FROM BossUserData WHERE id=?`)
          .get(link);
      } catch (e) {
        console.log(e);
        return interaction
          .reply({
            content: "There was an issue with the BossFight Database.",
            ephemeral: true,
          })
          .catch(console.log);
      }

      try {
        var data_now = db_ud
          .prepare(`SELECT * FROM UserDataLive WHERE id=?`)
          .get(link);
      } catch (e) {
        console.log(e);
        return interaction
          .reply({
            content: "There has been an issue with the Live database.",
            ephemeral: true,
          })
          .catch(console.log);
      }
      if (!data_then || !data_now)
        return interaction.reply({
          content: "There has been an issue with your database entry.",
          ephemeral: true,
        });

      //got user data
      let steps = parseInt(data_now.steps) - parseInt(data_then.steps);
      let NPC = parseInt(data_now.npc) - parseInt(data_then.npc);
      let PVP = parseInt(data_now.pvp) - parseInt(data_then.pvp);
      let quests = parseInt(data_now.quests) - parseInt(data_then.quests);

      let damage = Math.floor(
        5000 *
          (1 -
            Math.pow(
              Math.E,
              -(1 / 4500) *
                (steps * (1 + (0.15 * NPC + 0.2 * PVP + 0.1 * quests)))
            )) *
          1.1
      );

      let leaderboards = JSON.parse(fs.readFileSync("./data/boss_LB.json"));
      let overall_damage = 0;
      for (let i = 0; i < leaderboards.length; i++) {
        if (leaderboards[i].id === interaction.user.id) {
          overall_damage = leaderboards[i].damage;
          i = leaderboards.length;
        }
      }

      try {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                  `<:BB_Boss:1027227600784982077> ┊ You have charged up your attack to deal ${damage} damage. (${overall_damage})\n<:blank:1019977634249187368> ┊ Steps: ${steps}, Multiplier: ${(
                    1 +
                    (0.15 * NPC + 0.2 * PVP + 0.1 * quests)
                  ).toFixed(
                    2
                  )}x\n<:blank:1019977634249187368> ┊ Next Auto Cycle: <t:${roundToHour(
                    new Date()
                  )}:R>`
                ),
            ],
            ephemeral: true,
          })
          .catch(console.log);
      } catch (e) {
        interaction.channel
          .send(`You have charged up your attack to deal ${damage} damage.`)
          .then((msg) => {
            setTimeout(() => {
              msg.delete();
            }, 15000);
          });
        console.log(e);
      }
    }
    //end of raid boss
    //handle ticket button
    if (interaction.customId === "ticket_button") {
      const userInfoField = new TextInputBuilder()
        .setCustomId("ticket_user_info")
        .setLabel("Your ingame id")
        .setPlaceholder("(type - if linked to the bot)")
        .setStyle(TextInputStyle.Short);

      const inputField = new TextInputBuilder()
        .setCustomId("ticket_details")
        .setLabel("Provide any additional information")
        .setStyle(TextInputStyle.Paragraph);

      const actionRowOne = new ActionRowBuilder().addComponents(userInfoField);
      const actionRowTwo = new ActionRowBuilder().addComponents(inputField);

      const modal = new ModalBuilder()
        .setCustomId("open_ticket")
        .setTitle("Open a Ticket")
        .addComponents(actionRowOne, actionRowTwo);

      return interaction.showModal(modal);
    }
    if (interaction.customId === "new_role_ticket") {
      const roleNameField = new TextInputBuilder()
        .setCustomId("ticket_role_name")
        .setLabel("Role Name")
        .setStyle(TextInputStyle.Short);

      const roleColorField = new TextInputBuilder()
        .setCustomId("ticket_role_color")
        .setLabel("Role Color")
        .setPlaceholder("#FFFFFF")
        .setStyle(TextInputStyle.Short);

      const roleEmojiField = new TextInputBuilder()
        .setCustomId("ticket_role_emoji")
        .setLabel("Role Emoji")
        .setPlaceholder(
          "Please provide the emoji or the link where it can be found."
        )
        .setStyle(TextInputStyle.Short);

      const actionRowOne = new ActionRowBuilder().addComponents(roleNameField);
      const actionRowTwo = new ActionRowBuilder().addComponents(roleColorField);
      const actionRowThree = new ActionRowBuilder().addComponents(
        roleEmojiField
      );

      const modal = new ModalBuilder()
        .setCustomId("open_role_ticket")
        .setTitle("Request a new custom role")
        .addComponents(actionRowOne, actionRowTwo, actionRowThree);

      return interaction.showModal(modal);
    }
    if (interaction.customId === "edit_role_ticket") {
      const roleNameField = new TextInputBuilder()
        .setCustomId("ticket_role_name")
        .setLabel("Role Name")
        .setStyle(TextInputStyle.Short);

      const roleColorField = new TextInputBuilder()
        .setCustomId("ticket_role_color")
        .setLabel("Role Color")
        .setPlaceholder("#FFFFFF")
        .setStyle(TextInputStyle.Short);

      const roleEmojiField = new TextInputBuilder()
        .setCustomId("ticket_role_emoji")
        .setLabel("Role Emoji")
        .setPlaceholder(
          "Please provide the emoji or the link where it can be found."
        )
        .setStyle(TextInputStyle.Short);

      const actionRowOne = new ActionRowBuilder().addComponents(roleNameField);
      const actionRowTwo = new ActionRowBuilder().addComponents(roleColorField);
      const actionRowThree = new ActionRowBuilder().addComponents(
        roleEmojiField
      );

      const modal = new ModalBuilder()
        .setCustomId("edit_role_ticket")
        .setTitle("Edit your custom role")
        .addComponents(actionRowOne, actionRowTwo, actionRowThree);

      return interaction.showModal(modal);
    }
    if (interaction.customId === "point_ticket_button") {
      const userInfoField = new TextInputBuilder()
        .setCustomId("ticket_user_info")
        .setLabel("Your ingame id")
        .setPlaceholder("(type - if linked to the bot)")
        .setStyle(TextInputStyle.Short);

      const itemType = new TextInputBuilder()
        .setCustomId("ticket_point_type")
        .setLabel("Item Type")
        .setStyle(TextInputStyle.Short);

      const itemQuantity = new TextInputBuilder()
        .setCustomId("ticket_point_quant")
        .setLabel("Quantity")
        .setPlaceholder("1")
        .setStyle(TextInputStyle.Short);

      const actionRowOne = new ActionRowBuilder().addComponents(userInfoField);
      const actionRowTwo = new ActionRowBuilder().addComponents(itemType);
      const actionRowThree = new ActionRowBuilder().addComponents(itemQuantity);

      const modal = new ModalBuilder()
        .setCustomId("point_ticket")
        .setTitle("Trade Your Points")
        .addComponents(actionRowOne, actionRowTwo, actionRowThree);

      return interaction.showModal(modal);
    }
  }
  if (interaction.isContextMenuCommand()) {
    const { commands } = client;
    const { commandName } = interaction;
    let contextCommand = commands.get(commandName);
    if (!contextCommand) return;

    try {
      await contextCommand.execute(
        interaction,
        Discord,
        client,
        version,
        helper,
        db_gen,
        db_ud
      );
    } catch (e) {
      console.log(e);
    }
  }
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "open_ticket") {
      let user_id = interaction.fields.getTextInputValue("ticket_user_info");
      const reason = interaction.fields.getTextInputValue("ticket_details");
      if (!/^[0-9]*$/.test(user_id)) {
        let link_data = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
        if (!link_data)
          return interaction.reply({
            content:
              "You did not provide a valid id and are not linked to the bot.",
            ephemeral: true,
          });
        user_id = link_data.SMMO_ID;
      }
      let channel = await createTicket(interaction, "general", reason, user_id);
      return interaction.reply({
        content: `Your ticket was opened in ${channel}`,
        ephemeral: true,
      });
    }
    if (interaction.customId === "open_role_ticket") {
      const roleName = interaction.fields.getTextInputValue("ticket_role_name");
      const roleColor =
        interaction.fields.getTextInputValue("ticket_role_color");
      const roleEmoji =
        interaction.fields.getTextInputValue("ticket_role_emoji");
      if (!/#[a-zA-Z0-9]{6}/.test(roleColor))
        return interaction.reply({
          content:
            "Invalid Hex Code for your role color.\nThe ticket has not been opened.",
          ephemeral: true,
        });

      let reason = {
        name: roleName,
        color: roleColor,
        emoji: roleEmoji,
      };
      let channel = await createTicket(interaction, "new_role", reason);
      return interaction.reply({
        content: `Your ticket was opened in ${channel}`,
        ephemeral: true,
      });
    }
    if (interaction.customId === "edit_role_ticket") {
      const roleName = interaction.fields.getTextInputValue("ticket_role_name");
      const roleColor =
        interaction.fields.getTextInputValue("ticket_role_color");
      const roleEmoji =
        interaction.fields.getTextInputValue("ticket_role_emoji");
      if (!/#[a-zA-Z0-9]{6}/.test(roleColor))
        return interaction.reply({
          content:
            "Invalid Hex Code for your role color.\nThe ticket has not been opened.",
          ephemeral: true,
        });

      let reason = {
        name: roleName,
        color: roleColor,
        emoji: roleEmoji,
      };
      let channel = await createTicket(interaction, "edit_role", reason);
      return interaction.reply({
        content: `Your ticket was opened in ${channel}`,
        ephemeral: true,
      });
    }
    if (interaction.customId === "point_ticket") {
      let user_id = interaction.fields.getTextInputValue("ticket_user_info");
      if (!/^[0-9]*$/.test(user_id)) {
        let link_data = db_gen
          .prepare(`SELECT * FROM links WHERE Discord_ID=?`)
          .get(interaction.user.id);
        if (!link_data)
          return interaction.reply({
            content:
              "You did not provide a valid id and are not linked to the bot.",
            ephemeral: true,
          });
        user_id = link_data.SMMO_ID;
      }
      const itemType =
        interaction.fields.getTextInputValue("ticket_point_type");
      const itemQuantity =
        interaction.fields.getTextInputValue("ticket_point_quant");

      let reason = {
        type: itemType,
        quantity: itemQuantity,
      };
      let channel = await createTicket(
        interaction,
        "redeem_points",
        reason,
        user_id
      );
      return interaction.reply({
        content: `Your ticket was opened in ${channel}`,
        ephemeral: true,
      });
    }
  }
});
//end of interaction handler

client.login(token);
