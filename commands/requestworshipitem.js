const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('requestworshipitem')
        .setDescription('adds your request to the list'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');

        let user = interaction.user;

        let requests = JSON.parse(fs.readFileSync("./data/requests.json"));

        let link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!link) return interaction.reply({ content: "Account is not linked. Run \`/gverify [yourSMMOid]\` to link your account.", ephemeral: true })
        let userLink = link.SMMO_ID;

        for (var i = 0; i < requests.worship.length; i++) {
            if (requests.worship[i].id === user.id) {
                return interaction.reply({ content: "You already have a pending request.", ephemeral: true });
            }
        }

        requests.worship.push({
            "id": user.id,
            "link": userLink
        })
        fs.writeFileSync("./data/requests.json", JSON.stringify(requests));
        return interaction.reply({
            content: `<@&1031274077098356889>`, 
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`[<:BB_Check:1031690264089202698>] ${user}, Successfully placed your request.`)
            ]
        });
    }
}