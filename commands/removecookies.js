const { SlashCommandBuilder, EmbedBuilder, UserContextMenuCommandInteraction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecookies')
        .setDescription('removes cookies from the specified user')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("@user")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("points")
                .setDescription("the amount of points you would like to add")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        //get the user
        try {
            if (interaction.options.getString("user")) {
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true })
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        let points = parseInt(interaction.options.getString("points"));
        if (!Number.isInteger(points)) return interaction.reply({ content: `Please enter a valid amount of cookies.`, ephemeral: true });

        //get user link
        let link_data = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id);
        if (!link_data) return interaction.reply({ content: `${user} is unlinked.`, ephemeral: true });
        let link = link_data.SMMO_ID;
        
        let current_points = db_gen.prepare(`SELECT * FROM EventData where id=?`).get(link);
        if (!current_points) return interaction.reply({ content: `User has no DB entry, please wait 5 minutes.`, ephemeral: true })
        
        current_points = current_points.balance;
        let new_points = current_points - points;
        if (new_points < 0) return interaction.reply({ content: `${user} does not have that many points. They only have ${current_points} points.`, ephemeral: true })

        let cmd = db_gen.prepare(`UPDATE EventData SET balance=? WHERE id=?`);
        cmd.run(
            new_points,
            link
        )
        return interaction.reply({ embeds: [
            new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`<:cookies:1046427957046018079> ┊ Successfully removed ${points} cookies from ${user}.\n<:blank:1019977634249187368> ┊ They now have ${new_points} cookies.`)
        ]})
    }
}