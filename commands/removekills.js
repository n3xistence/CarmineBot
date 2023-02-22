const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removekills')
        .setDescription('enlist a player as a mercenary for the guild')
        .addStringOption((option) =>
        option
            .setName("user")
            .setDescription("mention a user or user id")
            .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("kills")
                .setDescription("the amount of kills you would like to remove")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("price")
                .setDescription("the price per kill")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        if (!interaction.options.getString("user")) {
            var user = interaction.user;
        } else {
            let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
            var user = client.guilds.cache.get(interaction.guild.id).members.cache.get(user_id);
        }

        if (!user) return interaction.reply({ content: "There has been an error retrieving the user.", ephemeral: true })
        else user = user.user;

        let kills = parseInt(interaction.options.getString("kills"));
        if (!Number.isInteger(kills) || kills <= 0) return interaction.reply({ content: "Please provide a valid amount of kills", ephemeral: true })
        
        let price = parseInt(interaction.options.getString("price"));
        if (price){
            if (!Number.isInteger(price) || price <= 0) return interaction.reply({ content: "Please provide a valid price.", ephemeral: true })
        }

        let merc_data = JSON.parse(fs.readFileSync("./data/merc_data.json"));

        let exists = false;
        let total_kills = 0;
        for (var i = 0; i < merc_data.length; i++) {
            if (merc_data[i].id === user.id) {
                if (kills > merc_data[i].kills) return interaction.reply({ content: "You cannot remove more kills than that user has done.", ephemeral: true })
                
                total_kills = merc_data[i].kills - kills;
                merc_data[i].kills = total_kills;
                exists = true;
            }
        }
        if (!exists) return interaction.reply({ content: "This user is not currently enlisted.", ephemeral: true })

        let embed = new EmbedBuilder()
            .setColor('Green')
            .setDescription(`<:BB_Check:1031690264089202698> ┊ Successfully removed ${kills} kills.\n<:blank:1019977634249187368> ┊ They now have ${total_kills} kills.${(price) ? `\n<:blank:1019977634249187368> ┊ Specified price: ${numberWithCommas(price)}<:smmoGoldIcon:923398928454520862>` : ""}`)
            .addFields(
                { name: "Kills Removed:", value: `${numberWithCommas(kills)}<:BB_PVP:1027227607034515456>` },
            )
        if (price) {
            embed.addFields(
                { name: "Final Price:", value: `${numberWithCommas(price * kills)}<:smmoGoldIcon:923398928454520862>` }
            )
        }
            
        fs.writeFileSync("./data/merc_data.json", JSON.stringify(merc_data));
        return interaction.reply({ 
            content: `${user} your merc contract has been updated:`, 
            embeds: [embed]
        });
    }
}