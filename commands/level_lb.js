const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level_lb')
        .setDescription('displays the discord level leaderboard'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply();
        
        let user = interaction.user;
        
        let list = db_gen.prepare(`SELECT * FROM mee6levels ORDER BY level DESC`).all()

        var embedStrings = [];
        for (var i = 0; i < list.length; i++) {
            if (embedStrings[Math.floor(i / 10)] == undefined) {
                embedStrings[Math.floor(i / 10)] = "";
            }
            embedStrings[Math.floor(i / 10)] += `${(i + 1)}. [<@${list[i].id}>] - Level ${list[i].level}\n`
        }

        var embeds = [];
        for (var i = 0; i < embedStrings.length; i++) {
            var embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle("**Discord Levels**")
                .addFields(
                    { name: "Leaderboards", value: embedStrings[i] }
                )
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