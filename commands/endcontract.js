const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endcontract')
        .setDescription('ends the contract with an enlisted mercenary')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("mention a user or user id")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("price")
                .setDescription("the price per kill")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
        let user = client.guilds.cache.get(interaction.guild.id).members.cache.get(user_id).user;
        if (!user) return interaction.reply({ content: "Invalid user provided", ephemeral: true })

        let price = parseInt(interaction.options.getString("price"));
        if (!Number.isInteger(price) || price <= 0) return interaction.reply({ content: "Please provide a valid price.", ephemeral: true })

        let merc_data = JSON.parse(fs.readFileSync("./data/merc_data.json"));

        let exists = false;
        let kills = 0;
        for (var i = 0; i < merc_data.length; i++) {
            if (merc_data[i].id === user_id) {
                kills = merc_data[i].kills;
                merc_data.splice(i, 1);
                exists = true;    
            }
        }
        if (!exists) return interaction.reply({ content: "This user is not currently enlisted.", ephemeral: true })

        fs.writeFileSync("./data/merc_data.json", JSON.stringify(merc_data));

        let embed = new EmbedBuilder()
            .setDescription(`**__Contract ended: ${user}__**\nPrice specified: ${numberWithCommas(price)}<:smmoGoldIcon:923398928454520862>`)
            .setColor('DarkRed')
            .addFields(
                { name: "Kills:", value: `${numberWithCommas(kills)}<:BB_PVP:1027227607034515456>` },
                { name: "Final Price:", value: `${numberWithCommas(price*kills)}<:smmoGoldIcon:923398928454520862>` }
            )
            .setTimestamp()
        return interaction.reply({ embeds: [embed] });
    }
}