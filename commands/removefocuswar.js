const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removefocuswar')
        .setDescription('removes a guild from the focus wars')
        .addStringOption((option) =>
            option
                .setName("guildid")
                .setDescription("the ID of the guild")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");
        
        let guildID = interaction.options.getString("guildid");

        const config = JSON.parse(fs.readFileSync("./data/config.json"))
        const war_data = JSON.parse(fs.readFileSync("./data/focuswars.json"))

        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        let channel = client.channels.cache.get(config.server.channels.focuswars)
                        
        for (let i = 0;i < war_data.length;i++){
            if (war_data[i].id == guildID){
                let message = await channel.messages.fetch(war_data[i].msg_id);
                await message.delete().catch((e) => {console.log (e)});
                war_data.splice(i, 1);
                fs.writeFileSync("./data/focuswars.json", JSON.stringify(war_data));

                return interaction.reply({ content: `Guild ID \`${guildID}\` removed from focuswars.`, ephemeral: true })
            }
        }
        return interaction.reply({ content: `This ID is not currently listed as a focus war.`, ephemeral: true })
    }
}