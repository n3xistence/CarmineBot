const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warlist')
        .setDescription('displays all active wars')
        .addStringOption((option) =>
            option
                .setName("filter")
                .setDescription("filters the wars")
                .setRequired(true)
                .addChoices(
                    { name: "Ending", value: "Ending" },
                    { name: "Losing", value: "Losing" },
                    { name: "Close", value: "Close" },
                    { name: "Winning", value: "Winning" }
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply();

        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        let args = interaction.options.getString("filter");
        let user = interaction.user;

        var list = [];

        let war_data = db_gen.prepare(`SELECT * FROM wars`).all();
        for (let i = 0;i < war_data.length;i++){
            list.push([
                war_data[i].guild_1_id,
                war_data[i].guild_1_name,
                war_data[i].guild_1_kills,
                war_data[i].guild_2_kills,
                war_data[i].guild_2_name,
                war_data[i].guild_2_id,
                war_data[i].status
            ])
        }

        if (!list[0]) return interaction.editReply({ content: "No wars active", ephemeral: true })


        switch (args) {
            case "Winning":
                for (let i = 0; i < list.length; i++) {
                    if (list[i][0] == config.guilds[0].id) {
                        list[i].push(Math.abs(list[i][2] - list[i][3]))
                    } else {
                        list[i].push(Math.abs(list[i][3] - list[i][2]))
                    }

                    function sortFunction(a, b) {
                        if (a[7] === b[7]) {
                            return 0;
                        }
                        else {
                            return (a[7] > b[7]) ? -1 : 1;
                        }
                    }
                    list.sort(sortFunction);
                }
                break;
            case "Losing":
                let losing_list = [];
                let has_losing = false;
                for (let i = 0; i < list.length; i++) {
                    let val = 0;
                    if (list[i][0] == config.guilds[0].id) {
                        val = list[i][3] - list[i][2]
                    } else {
                        val = list[i][2] - list[i][3]
                    }

                    if (val > 0) {
                        has_losing = true;
                        list[i].push(val)
                        losing_list.push(list[i])
                    }
                }
                if (!has_losing) return interaction.editReply({ content: "You are currently not losing any wars", ephemeral: true })
                list = losing_list;

                function sortFunction(a, b) {
                    if (a[7] == b[7]) {
                        return 0;
                    }
                    else {
                        return (a[7] < b[7]) ? -1 : 1;
                    }
                }
                list.sort(sortFunction);
                break;
            case "Close":
                let return_list = []
                for (var i = 0; i < list.length; i++) {
                    if (list[i][2] > 0 && list[i][3] > 0) {
                        list[i].push(Math.abs(list[i][2] - list[i][3]))
                        return_list.push(list[i])
                    }
                }
                list = return_list;

                list.sort(function (a, b) {
                    return a[7] - b[7]
                });
                break;
            case "Ending":
                let temp_list = [];
                for (var i = 0; i < list.length; i++) {
                    if (parseInt(list[i][2]) >= 1800 || parseInt(list[i][3]) >= 1800) {
                        list[i].push((list[i][0] == config.guilds[0].id) ? `<:BB_Check:1031690264089202698> ${list[i][2]}` : `<:BB_Cross:1031690265334911086> ${list[i][3]}`)
                        temp_list.push(list[i])
                    }
                }
                list = temp_list;
                if (!list[0]) return interaction.editReply({ content: "There are no ending wars.", ephemeral: true })

                function sortFunction(a, b) {
                    if (a[7] === b[7]) {
                        return 0;
                    }
                    else {
                        if (a[0] == config.guilds[0].id) return (a[2] > b[2]) ? -1 : 1;
                        else return (a[3] > b[3]) ? -1 : 1;

                    }
                }
                list.sort(sortFunction);
                break;
            default:
                return interaction.editReply({
                    content: "Invalid argument.\n\n" +
                        "Accepted arguments:\n" +
                        `\`Winning\` shows wars sorted after highest-lowest lead for ${config.guilds[0].name}.\n` +
                        `\`Losing\` shows wars sorted after lowest-highest lead for ${config.guilds[0].name}.\n` +
                        `\`Ending\` shows wars that need less than 200 kills to finish (for either guild).\n` +
                        `\`Close\` shows wars sorted smallest-biggest difference in kills.`,
                    ephemeral: true
                })
        }

        var embedStrings = [];
        for (var i = 0; i < list.length; i++) {
            if (embedStrings[Math.floor(i / 10)] == undefined) {
                embedStrings[Math.floor(i / 10)] = "";
            }
            embedStrings[Math.floor(i / 10)] += `${(i + 1)}. [${list[i][7]} <:BB_PVP:1027227607034515456>] - [${list[i][1]}](https://web.simple-mmo.com/guilds/view/${list[i][0]}) vs [${list[i][4]}](https://web.simple-mmo.com/guilds/view/${list[i][5]})\n`
        }

        if (embedStrings === "") {
            return interaction.editReply({ content: "No wars active.", ephemeral: true })
        }

        var embeds = [];
        for (var i = 0; i < embedStrings.length; i++) {
            var embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`${args} Wars`)
                .setDescription(`${embedStrings[i]}`)
                .setFooter({ text: `Page ${i + 1} / ${embedStrings.length}` })
                .setTimestamp()
            embeds.push(embed);
        }

        //pagination
        if (embeds[1] == undefined) {
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

            interaction.editReply({ embeds: [embeds[0]], components: [returnPaginationRow(0)] }).then(msg => {
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