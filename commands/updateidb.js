function getAPI_Key() {
    const fs = require("fs");

    let api_data = JSON.parse(fs.readFileSync("./data/api_data.json"));
    if (api_data[2].limit >= 40) {
        if (api_data[1].limit >= 40) {
            if (api_data[0].limit >= 40) {
                return null;
            } else {
                api_data[0].limit++;
                fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
                return api_data[0].key;
            }
        } else {
            api_data[1].limit++;
            fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
            return api_data[1].key;
        }
    } else {
        api_data[2].limit++;
        fs.writeFileSync("./data/api_data.json", JSON.stringify(api_data));
        return api_data[2].key;
    }
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function getListElements(int, limit){
    let returnlist = [];
    for (let i = int;i <= (int+limit);i++){
        returnlist.push(i)
    }
    return returnlist;
}

const { SlashCommandBuilder, SelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateidb')
        .setDescription('updates the item database.')
        .addStringOption((option) =>
            option
                .setName("start")
                .setDescription("starting index of the item sync")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const axios = require('axios');
        if (interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true })

        let arg = parseInt(interaction.options.getString("start"));
        if (!Number.isInteger(arg)) return interaction.reply({ content: `Invalid argument, please provide an integer`, ephemeral: true })

        try {
            interaction.reply({ content: `Starting item sync at index ${arg}`, ephemeral: true })
        } catch (err) {
            console.log(`Item Sync error:\n${err}`)
        }

        
        let list = getListElements(parseInt(arg), 10000)
        async function getItemData() {
            for(i of list) {
                var url = `https://api.simple-mmo.com/v1/item/info/${i}`;

                var api_key = getAPI_Key();
                if (api_key !== null) {
                    try {
                        var response = await axios.post(url, { api_key: api_key });
                    } catch {
                        return null;
                    }
                    if (response == null || !response) { return }

                    var item = response.data;
                    console.log(item.name)
                    if (item.custom_item == 0) {
                        let filepath = `./data/SMMOItems.xlsx`;
                        let obj = { type: "id", value: item.id }
                        let payload = [item.id, item.name, item.type, item.level]

                        let exists = helper.getDataSet(helper.findData(obj, filepath), filepath)

                        if (!exists) {
                            helper.addEntry(obj, payload, filepath)
                        } else {
                            helper.updateEntry(helper.findData(obj, filepath), payload, filepath)
                        }
                    }
                } else i--;
                await wait(2500);
            }
        }
        getItemData().then(() => {
            interaction.channel.send("Item DB Sync Completed.")
        });
    }
}