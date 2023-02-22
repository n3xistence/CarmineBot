function getAPI_Key() {
    const fs = require("fs");

    let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
    if (api_data[0].limit >= 40) {
        if (api_data[1].limit >= 40) {
            if (api_data[2].limit >= 40) {
                return null;
            } else {
                api_data[2].limit++;
                fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
                return api_data[2].key;
            }
        } else {
            api_data[1].limit++;
            fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
            return api_data[1].key;
        }
    } else {
        api_data[0].limit++;
        fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
        return api_data[0].key;
    }
}


const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iteminfo')
        .setDescription('displays minor information about the item')
        .addStringOption((option) =>
            option
                .setName("itemname")
                .setDescription("name of the item")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const axios = require('axios');

        await interaction.deferReply()
        
        var item = interaction.options.getString("itemname");
        let filepath = `./data/SMMOItems.xlsx`
        let obj = { type: "name", value: item }
        let item_data = helper.getDataSet(helper.findData(obj, filepath), filepath)
        if (!item_data) return interaction.editReply({ content: "[‼️] No DB entry found for this item.", ephemeral: true })

        var url = `https://api.simple-mmo.com/v1/item/info/${item_data[0]}`;

        var api_key = getAPI_Key();
        if (api_key != null) {
            async function getUserData() {
                try {
                    return await axios.post(url, { api_key: api_key });
                } catch { return null }
            }

            getUserData().then(response => {
                if (response === null) return interaction.editReply({ content: "[‼️] API Error", ephemeral: true })
                var item = response.data;

                var stats = "";
                if (item.stat1 != "none" && item.stat1 != null) {
                    stats += item.stat1 + ": " + item.stat1modifier;
                }
                if (item.stat2 != "none" && item.stat2 != null) {
                    stats += "\n" + item.stat2 + ": " + item.stat2modifier;
                }
                if (item.stat3 != "none" && item.stat3 != null) {
                    stats += "\n" + item.stat3 + ": " + item.stat3modifier;
                }

                var price = item.market.low;
                if (parseInt(price) > 0) {
                    if (parseInt(price) >= 1000) {
                        if (parseInt(price) >= 1000000) {
                            price /= 1000000;
                            price += "m";
                        } else {
                            price /= 1000;
                            price += "k";
                        }
                    }
                    price += "<:smmoGoldIcon:923398928454520862>";
                } else {
                    price = "No listings found.";
                }

                try {
                    var embed = new EmbedBuilder()
                        .setColor('#2f3136')
                        .setThumbnail(`https://web.simple-mmo.com/${item.image_url}`, true)
                        .setTitle(`**Item Information for ${item.name}**`)
                        .setURL(`https://web.simple-mmo.com/market/listings?item_id=${item.id}&new_page=true`)
                    if (stats != "") {
                        embed.addFields({ name: "**Stats**", value: stats })
                    }
                    embed.addFields({ name: "**Lowest Listing:**", value: price })

                    return interaction.editReply({ embeds: [embed] })
                } catch {
                    return interaction.editReply({ content: "[‼️] There has been an error", ephemeral: true })
                }
            });
        } else {
            return interaction.editReply({ content: "[‼️] API Limit reached, try again in 1 minute.", ephemeral: true })
        }
    }
}