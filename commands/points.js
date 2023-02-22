const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('displays your  Points')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("user")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        try{ 
            if (interaction.options.getString("user")){
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else var user = interaction.user;
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        //get data
        let data = db_gen.prepare(`SELECT * FROM points WHERE id=?`).get(user.id);
        if (!data) return interaction.reply({ content: "You have no points.", ephemeral: true });

        let lb = db_gen.prepare(`SELECT * FROM points ORDER BY points DESC`).all();

        let placement = 0;
        for (let i = 0;i < lb.length;i++){
            if (lb[i].id === data.id){ 
                placement = i+1;
                i = lb.length;
            }
        }

        let points = data.points;

        return interaction.reply({ embeds: [
            new EmbedBuilder()
                .setColor('#2f3136')
                .setDescription(`<:BB_Bounties:1027227602320097361> ┊ ${user} currently has ${points} points.\n<:blank:1019977634249187368> ┊ They are #${placement} on the leaderboards.`)
        ] })
    }
}