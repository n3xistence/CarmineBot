const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lowestavstats')
        .setDescription('displays the users with the lowest gains in the specified category')
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("the type of stat you would like to check")
                .setRequired(true)
                .addChoices(
                    { name: "levels", value: "levels" },
                    { name: "steps", value: "steps" },
                    { name: "npc", value: "npc" },
                    { name: "pvp", value: "pvp" }
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        await interaction.deferReply();
        await interaction.editReply("Getting Guild Data. This may take a while...")
        let type = interaction.options.getString("type");

        let user_list = [];

        //get user data
        const list = db_gen.prepare(`SELECT Discord_ID, SMMO_ID FROM links`).all(); 
        
        for (let i = 0;i < list.length;i++){
            let linked_since = db_gen.prepare(`SELECT date FROM linkedsince WHERE id=?`).get(list[i].SMMO_ID);
            if (!linked_since) continue;
            if (linked_since.date === helper.getToday()) continue;

            try {
                var data_then = db_ud.prepare(`SELECT * FROM ud${linked_since.date.replace(/\-/g, "_")} WHERE id=?`).get(list[i].SMMO_ID);
            } catch(e) {
                if (e.message.startsWith("no such table:")) continue;
            }
            let data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(list[i].SMMO_ID);
            

            let user_array = [
                list[i].Discord_ID, 
                list[i].SMMO_ID, 
                data_now.level, 
                data_then.level, 
                data_now.steps, 
                data_then.steps, 
                data_now.npc, 
                data_then.npc, 
                data_now.pvp, 
                data_then.pvp, 
                helper.daysSince(linked_since.date)
            ]
            user_list.push(user_array)
        }
        
        //interaction.editReply("Data gathered.")

        let av_userlist = []
        for (let i = 0;i < user_list.length;i++){
            let stat = 0;
            switch (type) {
                case "levels":
                    stat = (parseInt(user_list[i][2]) - parseInt(user_list[i][3])) / parseInt(user_list[i][10]);
                    break;
                case "steps":
                    stat = (parseInt(user_list[i][4]) - parseInt(user_list[i][5])) / parseInt(user_list[i][10]);
                    break;
                case "npc":
                    stat = (parseInt(user_list[i][6]) - parseInt(user_list[i][7])) / parseInt(user_list[i][10]);
                    break;
                case "pvp":
                    stat = (parseInt(user_list[i][8]) - parseInt(user_list[i][9])) / parseInt(user_list[i][10]);
                    break;
                default:
                    return interaction.editReply("Please provide a valid stat");
            }
            let user_array = [user_list[i][0], user_list[i][1], stat.toFixed(2)];
            av_userlist.push(user_array);
        }
        
        //sort user array
        av_userlist.sort(function (a, b) {
            return b[2] - a[2];
        });
        
       

        var embedStrings = [];
        for (var i = 0; i < av_userlist.length; i++) {
            if (embedStrings[Math.floor(i / 10)] == undefined) {
                embedStrings[Math.floor(i / 10)] = "";
            }
            embedStrings[Math.floor(i / 10)] += `${i + 1}. [[Profile]](https://simplemmo.me/mobile/?page=user/view/${av_userlist[i][1]}) <@${av_userlist[i][0]}> - ${av_userlist[i][2]} ${type}/day\n`
        }

        if (embedStrings === "") {
            return interaction.editReply({ content: "No users found.", ephemeral: true })
        }

        var embeds = [];
        for (var i = 0; i < embedStrings.length; i++) {
            var embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Average ${type} gains`)
                .setDescription(`${embedStrings[i]}`)
                .setFooter({ text: `Page ${i + 1} / ${embedStrings.length}` })
                .setTimestamp()
            embeds.push(embed);
        }

        //pagination
        if (!embeds[1]) {
            return interaction.editReply({ embeds: [embeds[0]] });
        } else {
            function returnPaginationRow(counter) {
                row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back_all')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⏪')
                            .setDisabled(counter === 0),
                        new ButtonBuilder()
                            .setCustomId('back')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⬅️')
                            .setDisabled(counter === 0),
                        new ButtonBuilder()
                            .setCustomId('end')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⏹️'),
                        new ButtonBuilder()
                            .setCustomId('forward')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➡️')
                            .setDisabled(counter === (embeds.length - 1)),
                        new ButtonBuilder()
                            .setCustomId('forward_all')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⏩')
                            .setDisabled(counter === (embeds.length - 1)),
                    );
                return row;
            }

            let user = interaction.user;
            interaction.editReply({ content:"Data gathered:", embeds: [embeds[0]], components: [returnPaginationRow(0)] }).then(msg => {
                var counter = 0;
                const listener = async (interaction) => {
                    if (!interaction.message) return
                    if (interaction.user.id !== user.id) return;
                    if (interaction.message.id !== msg.id) return;

                    if (interaction.customId === "back_all") {
                        counter = 0;
                        interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                    }
                    if (interaction.customId === "back" && (counter - 1 >= 0)) {
                        counter--;
                        interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                    }
                    if (interaction.customId === "forward" && (counter + 1 < embeds.length)) {
                        counter++;
                        interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                    }
                    if (interaction.customId === "forward_all") {
                        counter = embeds.length - 1;
                        interaction.update({ embeds: [embeds[counter]], components: [returnPaginationRow(counter)] })
                    }
                    if (interaction.customId === "end") {
                        interaction.update({ embeds: [embeds[counter]], components: [] });
                        client.off("interactionCreate", listener)
                    }
                    await new Promise(resolve => setTimeout(() => {
                        try {
                            client.off("interactionCreate", listener)
                        } catch { }
                        resolve();
                    }, 120000));
                }
                client.on("interactionCreate", listener)
            });
        }
        //end of pagination
    }
}