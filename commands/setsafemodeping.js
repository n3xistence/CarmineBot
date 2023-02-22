const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setsafemodeping')
        .setDescription('enables or disables pings for safemode')
        .addStringOption((option) =>
            option
                .setName("value")
                .setDescription("on/off")
                .setRequired(true)
                .addChoices(
                    { name: "on", value: "on" },
                    { name: "off", value: "off" }
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require("fs");

        let input = interaction.options.getString("value")
        if (input === "on") input = 1;
        else input = 0;
        
        //get user link
        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(interaction.user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        
        let cmd = db_gen.prepare(`UPDATE links SET SM_Ping=? where Discord_ID=?`);
        let res = cmd.run(input, interaction.user.id);

        return interaction.reply({ content: `Successfully changed your safemode notice to \`${input === 1 ? "on" : "off"}\``, ephemeral: true })
    }
}