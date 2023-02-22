const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminunlink')
        .setDescription("unlinks a user's account")
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("user @ or id")
                .setRequired(true)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        await interaction.deferReply();

        const fs = require("fs");

        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        //get the user
        try{ 
            if (interaction.options.getString("user")){
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else return interaction.editReply({ content: `Please mention a valid user.`, ephemeral: true });
        } catch { return interaction.editReply({ content: `Please mention a valid user.`, ephemeral: true }); }

        let user_check = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); 
        if (!user_check) return interaction.editReply({ content: "User is currently not linked", ephemeral: true })
        let userLink = user_check.SMMO_ID;                    

        let verify_embed = new EmbedBuilder()
            .setDescription(`Are you sure you would like to unlink ${user}?`)
            .setThumbnail(user.displayAvatarURL())

        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId('deny')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            )
        interaction.editReply({ embeds: [verify_embed], components: [row] }).then(msg => {
            const listener = async (i) => {
                if (i.customId === "verify") {
                    interaction.editReply({ embeds: [verify_embed], components: [] }).then(msg => {
                        msg.react("<:BB_Check:1031690264089202698>")
                    })
                    client.off("interactionCreate", listener);

                    db_gen.prepare(`DELETE FROM links WHERE Discord_ID=?`).run(user.id);

                    //remove guild roles
                    let member = await interaction.guild.members.fetch(user.id);
        
                    //universal role
                    var role = client.guilds.cache.get(config.server.id).roles.cache.find(r => r.id === config.server.roles.guildmember.id)
                    member.roles.remove(role);

                    //guild specific role
                    for (let i = 0; i < config.guilds.length; i++) {
                        let role = client.guilds.cache.get(config.server.id).roles.cache.find(r => r.id === config.guilds[i].role)
                        member.roles.remove(role);
                    }

                    return i.reply({ content: `Successfully unlinked ${userLink} from ${user}` })
                }

                //deny reaction
                if (i.customId === "deny") {
                    interaction.editReply({ embeds: [verify_embed], components: [] });
                    
                    var denyembed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`${user} has not been unlinked.`)

                    client.off("interactionCreate", listener);
                    return i.reply({ embeds: [denyembed], ephemeral: true })
                }
            };
            client.on("interactionCreate", listener);
        })
    }
}