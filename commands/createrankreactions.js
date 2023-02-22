const { SlashCommandBuilder, EmbedBuilder, ReactionCollector } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrankreactions')
        .setDescription('creates embeds for ranks'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");

        let ranks = JSON.parse(fs.readFileSync("./data/ranks.json"));
        let config = JSON.parse(fs.readFileSync("./data/config.json"));
        let channel = config.server.channels.ranks;

        if (channel === "undefined") return interaction.reply({ content: "You do not have this channel set up. Use /setrankschannel to set up the channel.", ephemeral: true })

        channel = interaction.guild.channels.cache.get(channel)

        var embed_Steps = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*We only count stats from the moment you joined the guild.*")
            .setTitle("**Step  Guild Ranks**")
            .addFields(
                { name: "**Rank 1:**", value: `👣 Take ${ranks.steps.rank1.value} steps.\nTitle: ${ranks.steps.rank1.title}` },
                { name: "**Rank 2:**", value: `👣 Take ${ranks.steps.rank2.value} steps.\nTitle: ${ranks.steps.rank2.title}` },
                { name: "**Rank 3:**", value: `👣 Take ${ranks.steps.rank3.value} steps.\nTitle: ${ranks.steps.rank3.title}` }
            )

        var embed_NPC = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*We only count stats from the moment you joined the guild.*")
            .setTitle("**NPC Guild Ranks**")
            .addFields(
                { name: "**Rank 1:**", value: `👤 Kill ${ranks.NPC.rank1.value} NPCs.\nTitle: ${ranks.NPC.rank1.title}` },
                { name: "**Rank 2:**", value: `👤 Kill ${ranks.NPC.rank2.value} NPCs.\nTitle: ${ranks.NPC.rank2.title}` },
                { name: "**Rank 3:**", value: `👤 Kill ${ranks.NPC.rank3.value} NPCs.\nTitle: ${ranks.NPC.rank3.title}` }
            )

        var embed_PVP = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*We only count stats from the moment you joined the guild.*")
            .setTitle("**PVP Guild Ranks**")
            .addFields(
                { name: "**Rank 1:**", value: `🔪 Kill ${ranks.PVP.rank1.value} players.\nTitle: ${ranks.PVP.rank1.title}` },
                { name: "**Rank 2:**", value: `🔪 Kill ${ranks.PVP.rank2.value} players.\nTitle: ${ranks.PVP.rank2.title}` },
                { name: "**Rank 3:**", value: `🔪 Kill ${ranks.PVP.rank3.value} players.\nTitle: ${ranks.PVP.rank3.title}` }
            )

        var embed_gold = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*We only count stats from the moment you joined the guild.*")
            .setTitle("**Gold Donation Guild Ranks**")
            .addFields(
                { name: "**Rank 1:**", value: `🪙 Donate ${ranks.gold.rank1.value} gold.\nTitle: ${ranks.gold.rank1.title}` },
                { name: "**Rank 2:**", value: `🪙 Donate ${ranks.gold.rank2.value} gold.\nTitle: ${ranks.gold.rank2.title}` },
                { name: "**Rank 3:**", value: `🪙 Donate ${ranks.gold.rank3.value} gold.\nTitle: ${ranks.gold.rank3.title}` }
            )

        var embed_pp = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*We only count stats from the moment you joined the guild.*")
            .setTitle("**Powerpoint Donation Guild Ranks**")
            .addFields(
                { name: "**Rank 1:**", value: `🔮 Donate ${ranks.pp.rank1.value} powerpoints.\nTitle: ${ranks.pp.rank1.title}` },
                { name: "**Rank 2:**", value: `🔮 Donate ${ranks.pp.rank2.value} powerpoints.\nTitle: ${ranks.pp.rank2.title}` },
                { name: "**Rank 3:**", value: `🔮 Donate ${ranks.pp.rank3.value} powerpoints.\nTitle: ${ranks.pp.rank3.title}` }
            )

        channel.send({ embeds: [embed_Steps] }).then(msg => {
            msg.react("🥇");
            msg.react("🥈");
            msg.react("🥉");
            ranks.steps.id = msg.id;

            fs.writeFileSync("./data/ranks.json", JSON.stringify(ranks));
        })
        channel.send({ embeds: [embed_NPC] }).then(msg => {
            msg.react("🥇");
            msg.react("🥈");
            msg.react("🥉");
            ranks.NPC.id = msg.id;

            fs.writeFileSync("./data/ranks.json", JSON.stringify(ranks));
        })
        channel.send({ embeds: [embed_PVP] }).then(msg => {
            msg.react("🥇");
            msg.react("🥈");
            msg.react("🥉");
            ranks.PVP.id = msg.id;

            fs.writeFileSync("./data/ranks.json", JSON.stringify(ranks));
        })
        channel.send({ embeds: [embed_gold] }).then(msg => {
            msg.react("🥇");
            msg.react("🥈");
            msg.react("🥉");
            ranks.gold.id = msg.id;

            fs.writeFileSync("./data/ranks.json", JSON.stringify(ranks));
        })
        channel.send({ embeds: [embed_pp] }).then(msg => {
            msg.react("🥇");
            msg.react("🥈");
            msg.react("🥉");
            ranks.pp.id = msg.id;

            fs.writeFileSync("./data/ranks.json", JSON.stringify(ranks));
        })
        interaction.reply({ content: "Embed created!", ephemeral: true });
    }
}