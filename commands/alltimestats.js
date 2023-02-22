const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getLinkedDate(user, db_gen) {
    const fs = require('fs');

    //get user link
    let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
    if (!link) interaction.reply({ content: `You are unlinked. Use /gverify to link your account.`, ephemeral: true });

    try {  var linked_data = db_gen.prepare(`SELECT * FROM linkedsince WHERE id=?`).get(link.SMMO_ID) } 
    catch { }
    if (linked_data) var join_date = linked_data.date;

    return join_date ? join_date : "no entry";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alltimestats')
        .setDescription('shows your stats since linking')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("user @ or id")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        //get the user
        try{
            if (interaction.options.getString("user")){
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else {
                var user = interaction.user;
            }
        } catch { 
            return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true });
        }
        
        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        else var userLink = link.SMMO_ID;

        obj = { type: "id", value: userLink }

        try{ var data_then = db_ud.prepare(`SELECT * FROM JoinData WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            console.log(e)
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }

        try{ var data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link.SMMO_ID) } 
        catch(e) { 
            console.log(e)
            return interaction.reply({ content: "There has been an issue with the database.", ephemeral: true }) 
        }
        
        await interaction.deferReply();

        let linked_since = getLinkedDate(user, db_gen);
        let days = helper.daysSince(linked_since);

        let totalembed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${userLink}`)
            .setTitle(`[${userLink}] ${user.username}`)
            .setDescription(`🗓️ ┊ *alltime stats*\n<:blank:1019977634249187368> ┊ *since \`${linked_since}\`*`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "**Levels:**", value: `${(data_now.level - data_then.level)} <:BB_Levels:1027227604144640030> `, inline: true },
                { name: "**Steps:**", value: `${(data_now.steps - data_then.steps)} <:BB_Steps:1027227609723047966> `, inline: true },
                { name: "**NPC kills:**", value: `${(data_now.npc - data_then.npc)} <:BB_NPC:1027227605650391102>`, inline: true },
                { name: "**PVP kills:**", value: `${(data_now.pvp - data_then.pvp)} <:BB_PVP:1027227607034515456>`, inline: true },
                { name: "**Quests:**", value: `${(data_now.quests - data_then.quests)} <:BB_Quests:1027227608267636816> `, inline: true },
                { name: "**Tasks:**", value: `${(data_now.tasks - data_then.tasks)} <:BB_Tasks:1027227610993938472> `, inline: true },
                { name: "**Boss kills:**", value: `${(data_now.bosses - data_then.bosses)} <:BB_Boss:1027227600784982077> `, inline: true },
                { name: "**Bounties:**", value: `${(data_now.bounties - data_then.bounties)} <:BB_Bounties:1027227602320097361> `, inline: true }
            )
            .setTimestamp();

        let averageembed = new EmbedBuilder()
            .setColor('#fa283d')
            .setURL(`https://web.simple-mmo.com/user/view/${userLink}`)
            .setTitle(`[${userLink}] ${user.username}`)
            .setDescription(`🗓️ ┊ *average daily stats*\n<:blank:1019977634249187368> ┊ *linked since \`${linked_since}\`*`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "**Levels:**", value: `${((data_now.level - data_then.level) / days).toFixed(2)} <:BB_Levels:1027227604144640030> `, inline: true },
                { name: "**Steps:**", value: `${((data_now.steps - data_then.steps) / days).toFixed(2)} <:BB_Steps:1027227609723047966> `, inline: true },
                { name: "**NPC kills:**", value: `${((data_now.npc - data_then.npc) / days).toFixed(2)} <:BB_NPC:1027227605650391102>`, inline: true },
                { name: "**PVP kills:**", value: `${((data_now.pvp - data_then.pvp) / days).toFixed(2)} <:BB_PVP:1027227607034515456>`, inline: true },
                { name: "**Quests:**", value: `${((data_now.quests - data_then.quests) / days).toFixed(2)} <:BB_Quests:1027227608267636816> `, inline: true },
                { name: "**Tasks:**", value: `${((data_now.tasks - data_then.tasks) / days).toFixed(2)} <:BB_Tasks:1027227610993938472> `, inline: true },
                { name: "**Boss kills:**", value: `${((data_now.bosses - data_then.bosses) / days).toFixed(2)} <:BB_Boss:1027227600784982077> `, inline: true },
                { name: "**Bounties:**", value: `${((data_now.bounties - data_then.bounties) / days).toFixed(2)} <:BB_Bounties:1027227602320097361> `, inline: true }
            )
            .setTimestamp(); 
            
        let embeds = [totalembed, averageembed];
        function returnPaginationRow(counter) {
            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⬅️')
                        .setDisabled(counter === 0),
                    new ButtonBuilder()
                        .setCustomId('forward')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('➡️')
                        .setDisabled(counter === (embeds.length - 1))
                );
            return row;
        }

        let caller = interaction.user;
        interaction.editReply({ embeds: [embeds[0]], components: [returnPaginationRow(0)] }).then(msg => {
            let counter = 0;
            const listener = async (interaction) => {
                if (!interaction.message) return
                if (interaction.user.id !== caller.id) return;
                if (interaction.message.id !== msg.id) return;

                if (interaction.customId === "back" && (counter - 1 >= 0)) {
                    counter--;
                    interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                }
                if (interaction.customId === "forward" && (counter + 1 < embeds.length)) {
                    counter++;
                    interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                }
                await new Promise(resolve => setTimeout(() => {
                    try {
                        client.off("interactionCreate", listener)
                    } catch { }
                    resolve();
                }, 120000));
            }
            client.on("interactionCreate", listener)
        })
    }
}