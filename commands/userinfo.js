const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('displays information about the user')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("mention another user")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        if (interaction.isContextMenuCommand()) return;
        try{ 
            if (interaction.options.getString("user")){
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else var user = interaction.user;
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }


        //get points
        let point_data = db_gen.prepare(`SELECT * FROM points WHERE id=?`).get(user.id);
        let point_lb = db_gen.prepare(`SELECT * FROM points ORDER BY points DESC`).all();
        if (!point_data) var points = 0;
        else var points = point_data.points;

        let point_placement = 0;
        if (point_data){
            for (let i = 0;i < point_lb.length;i++){
                if (point_lb[i].id === point_data.id){ 
                    point_placement = i+1;
                    i = point_lb.length;
                }
            }
        }

        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) var userLink = "unlinked";
        else{ 
            var userLink = link.SMMO_ID;
            var SMPing = "off";
            if (link.SM_Ping === 1) SMPing = "on";
        }

        //get mee6level
        let level_lb = db_gen.prepare(`SELECT * FROM mee6levels ORDER BY level DESC`).all();
        let level_data = db_gen.prepare(`SELECT * FROM mee6levels WHERE id=?`).get(user.id); 
        if (!level_data) var userDiscordLevel = 0;
        else var userDiscordLevel = level_data.level;
       
        let level_placement = 0;
        if (level_data){
            for (let i = 0;i < level_lb.length;i++){
                if (level_lb[i].id === level_data.id){ 
                    level_placement = i+1;
                    i = level_lb.length;
                }
            }
        }
        let data = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(userLink);
        
        let created = Math.floor(new Date(user.createdAt)/1000)

        let finalEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setThumbnail(user.displayAvatarURL(), true)
            .setTitle(data ? `${data.name} User Info` : `**${user.username} User Info**`)
            .addFields(
                { name: "**Username**", value: `${user.username}`, inline: true },
                { name: "**Created on**", value: `<t:${created}:R> (<t:${created}:d>)`, inline: true},
                { name: "**SMMO ID:**", value: `${userLink}`, inline: true},
                { name: "**Safemode Pings:**", value: `${SMPing}`, inline: true},
                { name: "**Points:**", value: `${points} (#${point_placement})`, inline: true},
                { name: "**Level:**", value: `${userDiscordLevel} (#${level_placement})`, inline: true}
            );
        
        if (data){
            let linkedsince = db_gen.prepare(`SELECT * FROM linkedsince WHERE id=?`).get(userLink);
            linkedsince = helper.getUNIXStamp(linkedsince.date)
        
            finalEmbed.setURL(`https://simplemmo.me/mobile/?page=user/view/${userLink}`)
            .addFields(
                { name: "**Linked Since**", value: `<t:${linkedsince}:R> (<t:${linkedsince}:d>)`, inline: true },
            )
            .setDescription(`**Level:** ${numberWithCommas(data.level)} <:BB_Levels:1027227604144640030>\n**Steps:** ${numberWithCommas(data.steps)} <:BB_Steps:1027227609723047966>\n**NPC kills:** ${numberWithCommas(data.npc)} <:BB_NPC:1027227605650391102>\n**PVP kills:** ${numberWithCommas(data.pvp)} <:BB_PVP:1027227607034515456>\n**Quests:** ${numberWithCommas(data.quests)} <:BB_Quests:1027227608267636816>\n**Tasks:** ${numberWithCommas(data.tasks)} <:BB_Tasks:1027227610993938472>\n**Boss kills:** ${numberWithCommas(data.bosses)} <:BB_Boss:1027227600784982077>\n**Bounties:** ${numberWithCommas(data.bounties)} <:BB_Bounties:1027227602320097361>`)
        }
        interaction.reply({ embeds: [finalEmbed] });
    }
}