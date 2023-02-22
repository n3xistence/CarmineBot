const { SlashCommandBuilder, EmbedBuilder, ReactionCollector } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createguildrolereactions')
        .setDescription('creates embeds for the guild role'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync("./data/config.json"))

        if (config.server.channels.roles === "undefined") return interaction.reply({ content: "You do not have this channel set up. Use /setrolechannel to set up the channel.", ephemeral: true })

        let finalEmbed = new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setColor('#2f3136')
            .setTitle(`${interaction.guild.name} Guild Role`,)
            .addFields(
                { name: "Claim your role!", value: "If you are a member of the guild, change your discord nickname to match your ingame name. \nThen react to this message and the bot will give you the role to chat! \n(note that special characters may not work)" }
            );
            
        interaction.guild.channels.cache.get(config.server.channels.roles).send({ embeds: [finalEmbed] }).then(msg => {
            msg.react("🪙");

            let reaction_data = JSON.parse(fs.readFileSync("./data/reactions.json"));
            reaction_data.guildrole.id = msg.id;
            fs.writeFileSync("./data/reactions.json", JSON.stringify(reaction_data));
        });
        interaction.reply({ content: "Embed created!", ephemeral: true });
    }
}