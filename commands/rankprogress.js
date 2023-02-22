const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankprogress')
        .setDescription('shows your progress for guild ranks'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        return interaction.reply({ content: "This feature is in not yet available to you.", ephemeral: true })
        await interaction.deferReply()

        let fs = require('fs')
        let ranks = JSON.parse(fs.readFileSync("./data/ranks.json"));
        let user = interaction.member;

        let progressBar_steps = "";
        let progressBar_NPC = "";
        let progressBar_PVP = "";
        
        //get data
        let filepath = `./data/Links.xlsx`
        let obj = {
            type: "Discord ID",
            value: interaction.user.id
        }
        let userLink = helper.getDataSet(helper.findData(obj, filepath), filepath)

        if (!userLink) return interaction.editReply("account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.")
        else userLink = userLink[1]

        filepath = `./data/JoinData.xlsx`
        obj = {
            type: "id",
            value: userLink
        }
        try {
            var [, , , thenSteps, thenNPC, thenPVP, , , , ] = helper.getDataSet(helper.findData(obj, filepath), filepath)
        } catch {
            return interaction.editReply({ content: "There was an issue with the on-join Database.", ephemeral: true })
        }

        filepath = `./data/UserDataLive.xlsx`
        try {
            var [, , , nowSteps, nowNPC, nowPVP, , , , ] = helper.getDataSet(helper.findData(obj, filepath), filepath)
        } catch {
            return interaction.editReply({ content: "Your database entry could not be found.", ephemeral: true })
        }
        

        //PERCENTAGE ((nowValue - thenValue) / rawData) * 100).toFixed(1)
        
        //steps bar
        if (user.roles.cache.find(r => r.id === ranks.steps.rank1.role) || user.roles.cache.find(r => r.id === ranks.steps.rank2.role) || user.roles.cache.find(r => r.id === ranks.steps.rank3.role)) progressBar_steps += `▰▰[x]`
        else {
            let z = (((nowSteps - thenSteps) / ranks.steps.rank1.value) * 100);
            for (let i = 0; i < 20; i += 10) {
                if (z - 50 >= 0) {
                    progressBar_steps += "▰";
                    z -= 50;
                } else {
                    progressBar_steps += "▱";
                }
            }
            if ((nowSteps - thenSteps >= ranks.steps.rank1.value)) progressBar_steps += "[?]"
            else progressBar_steps += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.steps.rank2.role) || user.roles.cache.find(r => r.id === ranks.steps.rank3.role)) progressBar_steps += `▰▰[x]`
        else {
            let z = (((nowSteps - thenSteps-ranks.steps.rank1.value) / (ranks.steps.rank2.value-ranks.steps.rank1.value)) * 100);
            for (let i = 0; i < 20; i += 10) {
                if (z - 50 >= 0) {
                    progressBar_steps += "▰";
                    z -= 50;
                } else {
                    progressBar_steps += "▱";
                }
            }
            if ((nowSteps - thenSteps >= ranks.steps.rank2.value)) progressBar_steps += "[?]"
            else progressBar_steps += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.steps.rank3.role)) progressBar_steps += `▰▰▰▰▰▰[x]`
        else {
            let z = (((nowSteps - thenSteps-ranks.steps.rank2.value) / (ranks.steps.rank3.value-ranks.steps.rank2.value)) * 100);
            for (let i = 0; i < 60; i += 10) {
                if (z - 17 >= 0) {
                    progressBar_steps += "▰";
                    z -= 17;
                } else {
                    progressBar_steps += "▱";
                }
            }
            if ((nowSteps - thenSteps >= ranks.steps.rank3.value)) progressBar_steps += "[?]"
            else progressBar_steps += "[ ]"
        }

        //NPC bar
        if (user.roles.cache.find(r => r.id === ranks.NPC.rank1.role) || user.roles.cache.find(r => r.id === ranks.NPC.rank2.role) || user.roles.cache.find(r => r.id === ranks.NPC.rank3.role)) progressBar_NPC += `▰▰[x]`
        else {
            let z = (((nowNPC - thenNPC) / ranks.NPC.rank1.value) * 100);
            for (let i = 0; i < 15; i += 10) {
                if (z -50 >= 0) {
                    progressBar_NPC += "▰";
                    z -= 50;
                } else {
                    progressBar_NPC += "▱";
                }
            }
            if ((nowNPC - thenNPC >= ranks.NPC.rank1.value)) progressBar_NPC += "[?]"
            else progressBar_NPC += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.NPC.rank2.role) || user.roles.cache.find(r => r.id === ranks.NPC.rank3.role)) progressBar_NPC += `▰▰[x]`
        else {
            let z = (((nowNPC - thenNPC-ranks.NPC.rank1.value) / (ranks.NPC.rank2.value-ranks.NPC.rank1.value)) * 100);
            for (let i = 0; i < 20; i += 10) {
                if (z - 50 >= 0) {
                    progressBar_NPC += "▰";
                    z -= 50;
                } else {
                    progressBar_NPC += "▱";
                }
            }
            if ((nowNPC - thenNPC >= ranks.NPC.rank2.value)) progressBar_NPC += "[?]"
            else progressBar_NPC += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.NPC.rank3.role)) progressBar_NPC += `▰▰▰▰▰▰[x]`
        else {
            let z = (((nowNPC - thenNPC-ranks.NPC.rank2.role) / (ranks.NPC.rank3.value-ranks.NPC.rank2.value)) * 100);
            for (let i = 0; i < 60; i += 10) {
                if (z - 17 >= 0) {
                    progressBar_NPC += "▰";
                    z -= 17;
                } else {
                    progressBar_NPC += "▱";
                }
            }
            if ((nowNPC - thenNPC >= ranks.NPC.rank3.value)) progressBar_NPC += "[?]"
            else progressBar_NPC += "[ ]"
        }

        //pvp bar
        if (user.roles.cache.find(r => r.id === ranks.PVP.rank1.role) || user.roles.cache.find(r => r.id === ranks.PVP.rank2.role) || user.roles.cache.find(r => r.id === ranks.PVP.rank3.role)) progressBar_PVP += `▰▰[x]`
        else {
            let z = (((nowPVP - thenPVP) / ranks.PVP.rank1.value) * 100);
            for (let i = 0; i < 15; i += 10) {
                if (z - 50 >= 0) {
                    progressBar_PVP += "▰";
                    z -= 50;
                } else {
                    progressBar_PVP += "▱";
                }
            }
            if ((nowPVP - thenPVP) >= ranks.PVP.rank1.value) progressBar_PVP += "[?]"
            else progressBar_PVP += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.PVP.rank2.role) || user.roles.cache.find(r => r.id === ranks.PVP.rank3.role)) progressBar_PVP += `▰▰[x]`
        else {
            let z = (((nowPVP - thenPVP-ranks.PVP.rank1.value) / (ranks.PVP.rank2.value-ranks.PVP.rank1.value)) * 100);
            for (let i = 0; i < 20; i += 10) {
                if (z - 50 >= 0) {
                    progressBar_PVP += "▰";
                    z -= 50;
                } else {
                    progressBar_PVP += "▱";
                }
            }
            if ((nowPVP - thenPVP) >= ranks.PVP.rank2.value) progressBar_PVP += "[?]"
            else progressBar_PVP += "[ ]"
        }
        if (user.roles.cache.find(r => r.id === ranks.PVP.rank3.role)) progressBar_PVP += `▰▰▰▰▰▰[x]`
        else {
            let z = (((nowPVP - thenPVP - ranks.PVP.rank2.value) / (ranks.PVP.rank3.value-ranks.PVP.rank2.value)) * 100);
            for (let i = 0; i < 60; i += 10) {
                if (z - 17 >= 0) {
                    progressBar_PVP += "▰";
                    z -= 17;
                } else {
                    progressBar_PVP += "▱";
                }
            }
            if ((nowPVP - thenPVP) >= ranks.PVP.rank3.value) progressBar_PVP += "[?]"
            else progressBar_PVP += "[ ]"
        }

        let finalEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`*${interaction.user.username}#${interaction.user.discriminator}* guild rank progress`)
            //.setThumbnail(interaction.user.displayAvatarURL());
            .addFields(
                { name: `**Steps:** __${(nowSteps - thenSteps)}__`, value: `\n${progressBar_steps}` },
                { name: `**NPC kills:** __${(nowNPC - thenNPC)}__`, value: `\n${progressBar_NPC}` },
                { name: `**PVP kills:** __${(nowPVP - thenPVP)}__`, value: `\n${progressBar_PVP}` }
            ).setTimestamp();

        interaction.followUp({ embeds: [finalEmbed], ephemeral: true });
    }
}