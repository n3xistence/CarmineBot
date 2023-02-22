const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeitem')
        .setDescription('removes the item from the specified user')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("@user")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("item")
                .setDescription("item name")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        return interaction.reply({ content: "This command is currently not available to you.", ephemeral: true })
        await interaction.deferReply()
        
        const xlsx = require('xlsx');
        let fs = require('fs');
        
        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        if (config.server.roles.moderator.id === "undefined") return interaction.editReply({ content: "The Moderator role is not set up correctly.\nUse /set role moderator to set it up.", ephemeral: true })
        if (!interaction.member.roles.cache.find(r => r.id === config.server.roles.moderator.id)) return interaction.editReply({ content: `Invalid authorisation`, ephemeral: true });
        
        let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
        let user = client.guilds.cache.get(interaction.guild.id).members.cache.get(user_id).user;
        if (!user) return interaction.editReply({ content: `Please mention a valid user.`, ephemeral: true });

        let item = interaction.options.getString("item");
        let filepath = `./data/SMMOItems.xlsx`;
        let obj = { type: "name", value: item }
        let item_data = helper.getDataSet(helper.findData(obj, filepath), filepath)
        if (!item_data) return interaction.editReply({ content: `Could not find the specified item in the database.`, ephemeral: true });
        item_id = item_data[0]


        var wb = xlsx.readFile(`./data/ArmoryLogs.xlsx`, { cellDates: true });
        var ws = wb.Sheets['logs'];

        var exists = false;
        var target = "";
        var counter = 1;
        while (target != undefined) {
            var tempAddress = "A";
            tempAddress += counter;
            try {
                target = ws[tempAddress].v;
                counter++;
            } catch {
                target = undefined;
            }
        }
        for (var i = 1; i < counter; i++) {
            var idAddress = "A" + i;
            var item1Address = "B" + i;
            var item2Address = "C" + i;
            if (ws[idAddress].v == user.id) {
                if (ws[item1Address].v == item_id) {
                    ws[item1Address].v = "0";
                    xlsx.writeFileSync(wb, `./data/ArmoryLogs.xlsx`, { cellDates: true });

                    return interaction.editReply(`Removed ${item_data[1]} from ${user}.`)
                } else if (ws[item2Address].v == item_id) {
                    ws[item2Address].v = "0";
                    xlsx.writeFileSync(wb, `./data/ArmoryLogs.xlsx`, { cellDates: true });

                    return interaction.editReply(`Removed ${item_data[1]} from ${user}.`)
                } else {
                    return interaction.editReply("This user does not currently have this item.")
                }
            }
        }
        if (!exists) {
            return interaction.editReply("This user does not exist in the database.")
        }
    }
}