const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cookies')
        .setDescription('displays your cookies for the december2022 event')
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
        let link_data = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id);
        if (!link_data) return interaction.reply({ content: "You are not linked.", ephemeral: true })
        let link = link_data.SMMO_ID;

        let data = db_gen.prepare(`SELECT * FROM EventData WHERE id=?`).get(link);
        if (!data) return interaction.reply({ content: "You have no cookies.", ephemeral: true });

        let lb = db_gen.prepare(`SELECT * FROM EventData ORDER BY balance DESC`).all();

        let placement = 0;
        for (let i = 0;i < lb.length;i++){
            if (lb[i].id === data.id){ 
                placement = i+1;
                i = lb.length;
            }
        }

        let points = data.balance;

        return interaction.reply({ embeds: [
            new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`<:cookies:1046427957046018079> ┊ ${user} currently has ${points} cookies.\n<:blank:1019977634249187368> ┊ They are #${placement} on the leaderboards.`)
        ] })
    }
}