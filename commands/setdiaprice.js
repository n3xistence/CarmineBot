const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdiaprice')
        .setDescription('sets the dia price to trigger alerts')
        .addStringOption((option) =>
            option
                .setName("price")
                .setDescription("the price per diamond")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");
        
        let price = interaction.options.getString("price");

        const config = JSON.parse(fs.readFileSync("./data/config.json"))
        const diaData = JSON.parse(fs.readFileSync("./data/dia_data.json"))

        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
    
        if (price.charAt(price.length - 1) == "m") {
            price = price.replace("m", "");
            price = (parseFloat(price) * 1000000);
        } else if (price.charAt(price.length - 1) == "k") {
            price = price.replace("k", "");
            price = (parseFloat(price) * 1000);
        } else if (parseFloat(price) > 0) {
            price = parseFloat(price);
        } else {
            return interaction.reply({ content: "invalid input.", ephemeral: true })
        }

        diaData.price = price;
        fs.writeFileSync("./data/dia_data.json", JSON.stringify(diaData));

        if (price >= 1000) {
            if (parseFloat(price) >= 1000000) {
                price /= 1000000;
                price += "m";
            } else {
                price /= 1000;
                price += "k";
            }
        }
        return interaction.reply({ content: `Adjusted dia threshold to \`${price}\`.`, ephemeral: true })
    }
}