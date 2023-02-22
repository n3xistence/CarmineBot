const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maketicketembed')
        .setDescription('creates an embed to let people open tickets')
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
            .setColor('DarkOrange')
            .setTitle('Open a Ticket')
            .setImage('https://cdnb.artstation.com/p/assets/images/images/040/874/565/large/camila-xiao-pixel-art-tavernkeeper-medieval-cute-retro-8bit-16bit-man-guy-bar-pixelartist-camilaxiao-camilacanuto2.jpg?1630103346')
            .setDescription('For any serious inquiries, please press the button below and provide a general overview for the reason of your inquiry.')

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_button`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:BB_Bounties:1027227602320097361>')
            );
        return channel.send({ embeds: [finalEmbed], components: [row] });
    }
}