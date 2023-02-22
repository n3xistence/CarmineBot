const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('target')
        .setDescription('sets a target and notifies you when they leave safemode.')
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("your target's SMMO ID")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let smmoID = interaction.options.getString("id");

        let target = db_gen.prepare(`SELECT * FROM targets WHERE member_id=?`).get(interaction.user.id); 

        if (target){
            if (!smmoID) return interaction.reply({ content: `Your target is set to ${target.target_id}`, ephemeral: true })
            
            if (!Number.isInteger(parseInt(smmoID))) return interaction.reply({ content: "You must provide a valid ID", ephemeral: true })
            
            let cmd = db_gen.prepare(`UPDATE targets SET target_id=? WHERE member_id=?`);
            cmd.run(smmoID, interaction.user.id);
           
            return interaction.reply({ content: `Successfully set target to ${smmoID}`, ephemeral: true })
        } else {
            if (!smmoID) return interaction.reply({ content: `You have no target set.`, ephemeral: true })
            
            if (!Number.isInteger(parseInt(smmoID))) return interaction.reply({ content: "You must provide a valid ID", ephemeral: true })
            
            let cmd = db_gen.prepare(`INSERT INTO targets VALUES (?, ?)`);
            cmd.run(interaction.user.id, smmoID);

            return interaction.reply({ content: `Successfully set target to ${smmoID}`, ephemeral: true })
        }
    }
}