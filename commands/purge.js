const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('deletes the x most recent messages in the channel!')
        .addStringOption((option) =>
            option
                .setName("amount")
                .setDescription("the amount of messages being deleted.")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let amount = interaction.options.getString("amount");
        if (!Number.isInteger(parseInt(amount))) return interaction.reply({ content: "Invalid argument.", ephemeral: true })
        amount = parseInt(amount);
        if (amount > 100) amount = 100

        interaction.channel.bulkDelete(amount)
        return interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true })
    }
}