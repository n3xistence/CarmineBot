const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

Array.prototype.getAverage = function(){
    if (!Array.isArray(this)) return;

    let val = 0;
    for (let i = 0;i < this.length;i++){
        if (!Number.isInteger(parseInt(this[i]))) return;
        val += parseInt(this[i]);
    }
    return val / this.length;
}

function getDifference (val1, val2){
    return (val1 === val2 || (!Number.isInteger(parseInt(val1)) || !Number.isInteger(parseInt(val2)))) ? 0 : Math.abs(parseInt(val1) - parseInt(val2))
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weeklyavstats')
        .setDescription('shows your average weekly stats'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        return interaction.reply({ content: "This feature is currently not available to you.", ephemeral:true })
        
        const fs = require("fs");
        
        //check if the ID is already linked
        let filepath = `./data/Links.xlsx`
        
        let obj = { type: "Discord ID", value: interaction.user.id }
        let link_check = helper.getDataSet(helper.findData(obj, filepath), filepath)
        if (!link_check) return interaction.reply({ content: "Your account is not linked.", ephemeral: true })
        let userLink = link_check[1]
        
        let ul = [];
        let templist = [];
        let starting_day = helper.getYesterday(helper.getToday())
        let day = starting_day;
        obj = { type: "id", value: userLink }

        let stop = false;
        let counter = 0;
        while (!stop){
            let filepath = `./data/userdata/${day}.xlsx`
            try {
                let data_set = helper.getDataSet(helper.findData(obj, filepath), filepath)
                if (!data_set){
                    if (counter < 7){
                        return interaction.reply({ content: "You have not been linked for long enough.", ephemeral: true })
                    } else stop = true;
                } else {
                    ul.push([templist[2], templist[3], templist[4], templist[5], templist[6], templist[7], templist[8], templist[9] ] = [data_set[2], data_set[3], data_set[4], data_set[5], data_set[6], data_set[7], data_set[8], data_set[9] ])

                    day = helper.getYesterday(day);
                    counter++;
                }
            } catch(error){ 
                if (error.code === "ENOENT"){
                    stop = true;
                } else {
                    return interaction.reply({ content: "There has been an unknown error while handling your data.", ephemeral: true }) 
                }
            }
        }
        
        let stats = [];
        for (let i = 1;i < ul.length;i++){
            stats.push([
                getDifference(ul[i][0], ul[i-1][0]), //level
                getDifference(ul[i][1], ul[i-1][1]), //steps
                getDifference(ul[i][2], ul[i-1][2]), //npc
                getDifference(ul[i][3], ul[i-1][3]), //pvp
                getDifference(ul[i][4], ul[i-1][4]), //quests
                getDifference(ul[i][5], ul[i-1][5]), //tasks
                getDifference(ul[i][6], ul[i-1][6]), //bosses
                getDifference(ul[i][7], ul[i-1][7]), //bounties
            ])
        }
        
        let averages = [];
        for (let i = 0;i < stats[0].length;i++){
            let average = 0;
            for (let j = 0;j < stats.length;j++){
                average += stats[j][i];
            }
            averages.push(average/stats[0].length)
        }

        let stat_embed = new EmbedBuilder()
            .setColor('Brown')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTitle(
                `Average Weekly Stats\n\`${starting_day}\` - \`${day}\``
            )
            .setDescription(
                `Levels: ${averages[0]}\nSteps: ${averages[1]}\nNPC kills: ${averages[2]}\nPvP kills: ${averages[3]}\nQuests: ${averages[4]}\nTasks: ${averages[5]}\nBosses: ${averages[6]}\nBounties: ${averages[7]}\n`,
            )
        interaction.reply({ embeds: [stat_embed] })
    }
}