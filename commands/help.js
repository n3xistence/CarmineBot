const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('displays help!')
        .addStringOption((option) =>
            option
                .setName("argument")
                .setDescription("what do you need help with?")
                .setRequired(true)
                .addChoices(
                    { name: "verify", value: "verify" },
                    { name: "ticket", value: "ticket" },
                    { name: "info", value: "info" },
                    { name: "calc", value: "calc" },
                    { name: "misc", value: "misc" }
                )
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let linkEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`Linking your account`)
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*Information on linking your discord account to your SMMO account*")
            .addFields(
                { name: "Why it's important:", value: "Linking your account is necessary for completing the weekly  Quests, claiming your guild ranks, earning Points and much more." },
                { name: "How to do it:", value: "You can run `/gverify [yourSMMOid]` to link your unique SMMO ID to your Discord account. \n(can be unlinked with `/unlink`)\nExample: \n`/gverify 261266`" },
                { name: "Where to find your ID:", value: "APP:\nYour personal ID can be found at the bottom of your stats page on your profile.\n\nWeb:\nYou can find your ID at the end of the url when visiting your profile.\nExample:\n\`https://web.simple-mmo.com/user/view/261266\`" }
            )

        let ticketEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`Tickets`)
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*Information on tickets*")
            .addFields(
                { name: "**What they are for:**", value: "We currently use tickets to manage armory requests. When you request an item in the game, it is mandatory to open a ticket in <#989993556481560586> so we can keep track of the items." },
                { name: "**How to open a ticket:**", value: "Head to <#989993556481560586> and read the instructions there. Afterwards, simply write `/ticket` in the channel and a ticket will be opened. It may take a few minutes for the moderators to get to you." }
            )

        let infoEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`Info`)
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*Commands to provide information about the guild, the bot or the user.*")
            .addFields(
                { name: "**/info**", value: "Provides general info about the bot and the server." },
                { name: "**/userinfo**", value: "Provides general info about the user including their linked ID." },
                { name: "**/versioninfo**", value: "Provides information about the bot's major changes." },
                { name: "**/patchininfo**", value: "Provides information about the bot's minor changes." }
            )

        let calcEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`Calculations`)
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*Commands used to calculate combat stats.*")
            .addFields(
                { name: "**/calcDef**", value: "Calculates how much defense you can hit at 100% with the provided dexterity." },
                { name: "**/calcDex**", value: "Calculates how much dexterity you need to hit the provided defense at 100%." },
                { name: "**/calcDmg [x] [y]**", value: "Calculates the min and max damage of x str against y def." },
                { name: "**/hitchance [x] [y]**", value: "Calculates your chance to hit an opponent with y def using x dex." }
            )

        let miscEmbed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`Misc commands`)
            .setThumbnail(client.user.displayAvatarURL(), true)
            .setDescription("*Miscellaneous commands*")
            .addFields(
                { name: "**/target**", value: "Sets a target to check for safemode. If the user leaves safemode, you will get a DM." },
                { name: "**/points**", value: "Shows your  Points." },
                { name: "**/blackjack**", value: "Lets you play a round of blackjack." },
                { name: "**/coinflip**", value: "Randomly picks one of the provided options." },
                { name: "**/define**", value: "Defines a thing using Urban Dictionary." },
                { name: "**/lb**", value: "Shows the Point leaderboards." },
                { name: "**/level_lb**", value: "Shows the Discord Level leaderboards." },
                { name: "**/rankprogress**", value: "Shows your progress on Guild Ranks." },
                { name: "**/quests**", value: "Shows the current quests in condensed format." }
            )

        switch (interaction.options.getString("argument")) {
            case "verify":
                return interaction.reply({ embeds: [linkEmbed] });
            case "ticket":
                return interaction.reply({ embeds: [ticketEmbed] });
            case "info":
                return interaction.reply({ embeds: [infoEmbed] });
            case "calc":
                return interaction.reply({ embeds: [calcEmbed] });
            case "misc":
                return interaction.reply({ embeds: [miscEmbed] });
            default:
                return interaction.reply({ content: "Invalid argument.", ephemeral: true })
        }
    }
}