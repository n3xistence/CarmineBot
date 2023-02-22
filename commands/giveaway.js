const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('commands to interact with giveaways')
        .addSubcommand(subcommand => subcommand
            .setName('start')
            .setDescription('lets you join the queue')
            .addStringOption(option => option
                .setName("prize")
                .setDescription("The thing you would like to give away")
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName("time")
                .setDescription("the time limit")
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName("winners")
                .setDescription("the amount of winners")
                .setRequired(true)
            )
            .addChannelOption(option => option
                .setName("channel")
                .setDescription("the channel to start the giveaway in")
                .setRequired(true)
            )
            .addRoleOption(option => option
                .setName("role")
                .setDescription("the role that can access the giveaway (default is all)")
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('list')
            .setDescription('shows all active giveaways')),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs')
        let config = JSON.parse(fs.readFileSync("./data/config.json"))
    
        if (interaction.options.getSubcommand() === "start"){
            let winners = parseInt(interaction.options.getString("winners"));
            let channel = interaction.options.getChannel("channel");
            let type = interaction.options.getString("prize");
            let time = interaction.options.getString("time");
            let role = interaction.options.getRole("role");
            if (!role) role = "none";
            
            let times = time
                .split(/[0-9]+/)
                .filter(e => e !== undefined && e !== "")
                .map(e => e.replace(" ", ""));

            let nums = time
                .split(/(\s)|days|d|minutes|min|m|hours|h|weeks|w/)
                .filter(e => e !== undefined && e !== "" && e !== " ")
                .map(e => parseInt(e));
            
            if (nums.length !== times.length) interaction.reply({ content: "Could not parse your time input. Accepted:\n<m/min/minutes/h/hours/d/days/w/weeks>\n\nFormat:\`\`\`12d14h13min\`\`\`\n\`\`\`1day 6h 7minutes\`\`\`", ephemeral: true })
            
            time = 0;
            for (let i = 0;i < times.length;i++){
                if(times[i] === "m" || times[i] === "min" || times[i] === "minutes"){
                    time += 60*nums[i];
                } else if(times[i] === "h" || times[i] === "hours"){
                    time += 3600*nums[i];
                } else if (times[i] === "d" || times[i] === "days" || times[i] === "day"){
                    time += 86400*nums[i];
                } else if(times[i] === "w" || times[i] === "weeks"){
                    time += 604800*nums[i];
                } else {
                    return interaction.reply({ content: "Could not parse your time input. Accepted:\n<m/min/minutes/h/hours/d/days/w/weeks>\n\nFormat:\`\`\`12d14h13min\`\`\`\n\`\`\`1day 6h 7minutes\`\`\`", ephemeral: true })
                }
            }
            let stamp = helper.getUNIXStamp(helper.getToday());
            stamp += time;

            let list = db_gen.prepare(`SELECT * FROM giveaways`).all();

            let cmd = db_gen.prepare(`INSERT INTO giveaways VALUES(?, ?, ?, ?, ?, ?)`);
            cmd.run(
                list.length,
                interaction.user.id,
                type,
                stamp.toString(),
                winners,
                1
            )

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`join_giveaway`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🎉')
                ).addComponents(
                    new ButtonBuilder()
                        .setCustomId(`end_giveaway`)
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('<:BB_Cross:1031690265334911086>')
                );

            await channel.send({
                content: `<@&${config.server.roles.giveaways.id}>`,
                embeds: [
                    new EmbedBuilder()
                        .setColor('#f4a261')
                        .setTitle(`<:BB_Quests:1027227608267636816> ┊ Giveaway #${list.length+1}`)
                        .setDescription(`\uFEFF\n**Prize: ${type}**\n\nHost: ${interaction.user}\nWinners: **${winners}**\nEnds: <t:${stamp}:R>\nRole Needed: ${role}\n\n*Click the 🎉 button to enter!*`)
                ],
                components: [row]
            }).then(msg => {
                let giveaway_list = JSON.parse(fs.readFileSync("./data/giveaways.json"))
                giveaway_list.current.push({
                    "owner": interaction.user.id,
                    "role": role === "none" ? "none" : role.id,
                    "index": list.length,
                    "msg": {
                        "channel": channel.id,
                        "id": msg.id,
                    },
                    "users": []
                })
                fs.writeFileSync("./data/giveaways.json", JSON.stringify(giveaway_list, null, '\t'));
            })

            return interaction.reply({ content: `Successfully created your giveaway in ${channel}.\nIt will end in <t:${stamp}:R>`, ephemeral: true })
        }
        if (interaction.options.getSubcommand() === "list"){
            let giveaways = db_gen.prepare(`SELECT * FROM giveaways`).all().filter(e => e.active == 1);
            if (!giveaways) return interaction.reply({ content: "There are currently no active giveaways.", ephemeral: true })
           
            let string = "";
            for (let i = 0;i < giveaways.length;i++){
                string += `#${i+1} - ${giveaways[i].type} (${giveaways[i].winners} winners)\n`
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("<:BB_Quests:1027227608267636816> ┊ Active Giveaways")
                        .setColor('Blue')
                        .setDescription(string)
                ]
            })
        }
        if (interaction.options.getSubcommand() === "reroll"){
        
        }
    }
}