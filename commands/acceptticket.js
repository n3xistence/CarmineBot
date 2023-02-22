function startsWith(string, query) {
    if ((string.charAt(0) != query.charAt(0)) || (query.length > string.length)) {
        return false;
    } else {
        for (var i = 0; i < string.length; i++) {
            if (string.charAt(i) != query.charAt(i)) {
                return false;
            }
            if (i + 1 >= query.length) i = string.length;
        }
        return true;
    }
}

const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('acceptticket')
        .setDescription('accepts the ticket the command is used in.'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        if (!startsWith(interaction.channel.name, "ticket")) return interaction.reply({ content: `This command can only be used in ticket channels.`, ephemeral: true });
        
        var vembed = new EmbedBuilder()
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor('#2f3136')
            .setDescription("Are you sure you want to accept the ticket?")

        var userName = interaction.channel.name.replace("ticket-", "");

        var owner = client.users.cache.find(user => user.username.toLowerCase() == userName.toLowerCase());

        if (!owner) {
            return interaction.channel.send("There has been an error.")
        }

        interaction.reply("Verification needed:")
        interaction.channel.send({ embeds: [vembed] }).then(msg => {
            msg.react("✅");
            msg.react("❌");
            const listener = async (reaction, user) => {
                if (user.bot) return;

                if (reaction.emoji.name === "✅" && (reaction.message.id == msg.id) && interaction.user.id === user.id) {
                    owner.send("[✅] Your request has been accepted! Please check your inventory.")
                    interaction.channel.delete();
                    client.off("messageReactionAdd", listener)
                }
                if (reaction.emoji.name === "❌" && (reaction.message.id == msg.id) && interaction.user.id === user.id) {
                    var denyembed = new EmbedBuilder()
                        .setThumbnail(user.displayAvatarURL(), true)
                        .setColor('#FF0000')
                        .setDescription("The ticket has not been accepted.")
                    msg.edit({ embeds: [denyembed] });
                    msg.reactions.removeAll();
                    client.off("messageReactionAdd", listener)
                }
                if (reaction.message.id == msg.id) {
                    try {
                        reaction.users.remove(user.id);
                    } catch { }
                }
            };
            client.on("messageReactionAdd", listener)
        });
    }
}