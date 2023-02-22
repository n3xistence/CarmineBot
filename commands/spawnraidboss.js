const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawnraidboss')
        .setDescription('spawns a new raid boss.'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let fs = require('fs')
        let config = JSON.parse(fs.readFileSync("./data/config.json"))
        
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        if (config.server.channels.raidboss === "undefined") return interaction.reply({ content: "The Raidoss Channel is not set up correctly.\nUse /setbosschannel to set it up.", ephemeral: true })
       
        let channel = client.channels.cache.get(config.server.channels.raidboss)
        if (!channel) return interaction.reply({ content: "There has been an error fetching the raidboss channel.", ephemeral: true })
       
        fs.writeFileSync("./data/boss_LB.json", JSON.stringify([ ]));

        //drop current boss DB
        db_ud.prepare(`DROP TABLE IF EXISTS BossUserData`).run();
        
        //pick a name for the boss
        let first_names = ["Ar", "Do", "Du", "Zeh", "Brohk", "Ak", "Neh", "Rhak"]
        let last_names = ["Khal", "Sai", "Mah", "Ven", "Sha", "Stren", "Var", "Nhol"]
        let boss_name = `${randomPick(first_names)}'${randomPick(last_names)}`

        //pick the boss HP
        let link_data = db_gen.prepare(`SELECT * FROM links`).all();
        let min_hp = 4500*link_data.length;
        let max_hp = 5000*link_data.length;
        let hp = Math.floor(Math.random() * (max_hp - min_hp) + min_hp);


        let HP_bar = "";
        var z = ((hp / hp) * 100);

        //create the progress bar
        for (var i = 0; i < 100; i += 10) {
            if (z - 10 >= 0) {
                HP_bar += "▰";
                z -= 10;
            } else {
                HP_bar += "▱";
            }
        }

        let embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle(boss_name)
            .setThumbnail('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/0625c2f9-8190-4016-888a-b5e900cebd89/d6qf9nn-0c32e217-98e3-4b73-a0c9-96f5acbdc6f2.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA2MjVjMmY5LTgxOTAtNDAxNi04ODhhLWI1ZTkwMGNlYmQ4OVwvZDZxZjlubi0wYzMyZTIxNy05OGUzLTRiNzMtYTBjOS05NmY1YWNiZGM2ZjIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Xli8gfg7LLg5__VkSnmZxuOeXKNr50kuXdNky0_eJbI')
            .setFields({
                name: "HP:", value: `${hp} / ${hp}\n${HP_bar}`
            })

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('attack_boss')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔪')
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('check_boss_dmg')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔍')
            );

        channel.send({ embeds: [embed], components: [row] }).then(msg => {
            //copy the current stats
            cmd = db_ud.prepare(`CREATE TABLE BossUserData AS SELECT * FROM UserDataLive WHERE 1 = 1`)
            cmd.run();
            let data = {
                "name": boss_name,
                "hp": hp,
                "max_hp": hp,
                "id": msg.id
            }
            fs.writeFileSync("./data/boss_data.json", JSON.stringify(data));

            interaction.reply({ content: `A boss has been spawned in ${channel}`, ephemeral: true })
        })
    }
}