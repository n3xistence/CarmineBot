const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('makeroleticketembed')
        .setDescription('creates an embed to let people open tickets for roles')
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
            .setColor('#b4fc83')
            .setTitle('Custom Roles')
            .setImage('https://cdnb.artstation.com/p/assets/images/images/042/010/343/large/water-witch-rpg-tims-party-family-portrait.jpg?1633349928')
            .setDescription('To request a new custom role or edit your current one, please press the corresponding button below.')

        let row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`new_role_ticket`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel('New'),
            new ButtonBuilder()
                .setCustomId(`edit_role_ticket`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Edit')
            );
        return channel.send({ embeds: [finalEmbed], components: [row] });
    }
}