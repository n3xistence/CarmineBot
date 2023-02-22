const { SlashCommandBuilder, EmbedBuilder, UserContextMenuCommandInteraction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('adds points to the specified user')
        .addStringOption((option) =>
            option
                .setName("user")
                .setDescription("@user")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("points")
                .setDescription("the amount of points")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("questid")
                .setDescription("the ID of the quest (1-5)")
                .setRequired(false)
        ),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        let hasperms = interaction.member.permissions.has('ManageGuild')
        if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
        //get the user
        try {
            if (interaction.options.getString("user")) {
                let user_id = interaction.options.getString("user").replace(/<|@|!|>/g, "");
                var user = await client.users.fetch(user_id);
            } else { var user = interaction.user; }
        } catch { return interaction.reply({ content: `Please mention a valid user.`, ephemeral: true }); }

        let points = parseInt(await interaction.options.getString("points"));
        if (!Number.isInteger(points)) return interaction.reply({ content: `Please enter a valid amount of points.`, ephemeral: true });

        quest_id = parseInt(await interaction.options.getString("questid"));
        if (quest_id < 1 || quest_id > 5) return interaction.reply({ content: `Please enter a valid Quest ID (1-5).`, ephemeral: true });

        //get user link
        try{ var link = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(user.id); } 
        catch { return interaction.reply({ content: `${user} is unlinked. Use /gverify to link your account.`, ephemeral: true }) }
        
        try{ 
            var current_points = db_gen.prepare(`SELECT * FROM points WHERE id=?`).get(user.id); 
            let new_points = current_points.points + points;
            
            if (!quest_id){
                let cmd = db_gen.prepare(`UPDATE points SET points = ? WHERE id = ?`);
                cmd.run(new_points, user.id);

                let embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`Successfully added ${points} points to ${user}. They now have ${new_points} points.`)
                return interaction.reply({ embeds: [embed] })
            } else {
                var weeklycheck = db_gen.prepare(`SELECT * FROM weeklycheck WHERE id=?`).get(user.id); 
                if (weeklycheck){
                    switch (quest_id){
                        case 1:
                            if (weeklycheck.q_1 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 2:
                            if (weeklycheck.q_2 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 3:
                            if (weeklycheck.q_3 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 4:
                            if (weeklycheck.q_4 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 5:
                            if (weeklycheck.q_5 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        default:
                            return interaction.reply({ content: `Invalid Quest ID`, ephemeral: true })
                    }
                    let cmd = db_gen.prepare(`UPDATE weeklycheck SET q_${quest_id} = ? WHERE id = ?`);
                    cmd.run(1, user.id);
                } else {
                    switch (quest_id){
                        case 1:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 1, 0, 0, 0, 0);
                            break;
                        case 2:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 1, 0, 0, 0);
                            break;
                        case 3:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 1, 0, 0);
                            break;
                        case 4:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 0, 1, 0);
                            break;
                        case 5:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 0, 0, 1);
                            break;
                        default:
                            return interaction.reply({ content: `Invalid Quest ID`, ephemeral: true })
                    }
                }
                
                let cmd = db_gen.prepare(`UPDATE points SET points = ? WHERE id = ?`);
                cmd.run(new_points, user.id);

                let embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`Successfully added ${points} points to ${user}. They now have ${new_points} points.`)
                return interaction.reply({ embeds: [embed] })
            }
        }
        catch { 
            if (!quest_id){
                let cmd = db_gen.prepare(`INSERT INTO points VALUES (?, ?, ?)`);
                cmd.run(user.id, user.username, points);

                let embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`Successfully added ${points} points to ${user}. They now have ${points} points.`)
                return interaction.reply({ embeds: [embed] })
            } else {
                var weeklycheck = db_gen.prepare(`SELECT * FROM weeklycheck WHERE id=?`).get(user.id); 
                if (weeklycheck){
                    switch (quest_id){
                        case 1:
                            if (weeklycheck.q_1 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 2:
                            if (weeklycheck.q_2 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 3:
                            if (weeklycheck.q_3 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 4:
                            if (weeklycheck.q_4 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        case 5:
                            if (weeklycheck.q_5 === 1) return interaction.reply({ content: `User has already completed Quest #${quest_id}.`, ephemeral: true })
                            break;
                        default:
                            return interaction.reply({ content: `Invalid Quest ID`, ephemeral: true })
                    }
                    let cmd = db_gen.prepare(`UPDATE weeklycheck SET q_${quest_id} = ? WHERE id = ?`);
                    cmd.run(1, user.id);
                } else {
                    switch (quest_id){
                        case 1:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 1, 0, 0, 0, 0);
                            break;
                        case 2:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 1, 0, 0, 0);
                            break;
                        case 3:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 1, 0, 0);
                            break;
                        case 4:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 0, 1, 0);
                            break;
                        case 5:
                            var in_cmd = db_gen.prepare(`INSERT INTO weeklycheck VALUES (?, ?, ?, ?, ?, ?)`);
                            in_cmd.run(user.id, 0, 0, 0, 0, 1);
                            break;
                        default:
                            return interaction.reply({ content: `Invalid Quest ID`, ephemeral: true })
                    }
                }
                
                let cmd = db_gen.prepare(`INSERT INTO points VALUES (?, ?)`);
                cmd.run(user.id, points);

                let embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`Successfully added ${points} points to ${user}. They now have ${points} points.`)
                return interaction.reply({ embeds: [embed] })
            }
        }
        

        if (current_points){
            current_points = current_points[2]
            let new_points = current_points + points;

            
        }
    }
}