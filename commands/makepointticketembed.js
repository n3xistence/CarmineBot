const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('makepointticketembed')
        .setDescription('creates an embed to let people open tickets to redeem points')
        .addChannelOption(
            option => option
                .setName("channel")
                .setDescription("the channel to send the embed to")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let channel = interaction.options.getChannel("channel");
        if (!channel) return interaction.reply({ content: "Please specify a valid channel", ephemeral: true });

        let finalEmbed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('Redeem Points')
            .setImage('https://64.media.tumblr.com/db18e9f557ec2e7dcce599fe7d83dde1/tumblr_psm7mswmKI1sgm6puo1_640.gif')
            .setDescription('Here you can redeem your hard earned Points for goodies. Please specify the item and quantity in the form.')

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`point_ticket_button`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:BB_Bounties:1027227602320097361>')
            );
        return channel.send({ embeds: [finalEmbed], components: [row] });
    }
}