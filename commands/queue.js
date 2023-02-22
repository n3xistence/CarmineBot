const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('commands to interact with the queue')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('shows the queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('lets you join the queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('lets you leave the queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('moves the queue by one')),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        const fs = require('fs');
        let queue = JSON.parse(fs.readFileSync('./data/queue.json'))

        if (interaction.options.getSubcommand() === "join"){
            if (queue.active.user === interaction.user.id) return interaction.reply({ content: "You are currently the active user in the queue.", ephemeral: true })
       
            for (let i = 0;i < queue.users.length;i++){
                if (queue.users[i].id === interaction.user.id) return interaction.reply({ content: `You have already joined this queue. You are currently #${i+1}.`, ephemeral: true })
            }

            if (queue.active.stamp === "undefined"){
                queue.active.user = interaction.user.id;
                queue.active.stamp = helper.getUNIXStamp();
            } else {
                queue.users.push({
                    "joined": helper.getUNIXStamp(),
                    "id": interaction.user.id
                })
            }

            fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, "\t"))

            return queue.users.length > 0 
                ? interaction.reply({ content: `You have successfully joined the queue at #${queue.users.length}`, ephemeral: true })
                : interaction.reply({ content: `You are now the active user in the queue.`, ephemeral: true })
        }

        if (interaction.options.getSubcommand() === "leave"){
            if (queue.active.user === interaction.user.id){
                if (queue.users.length === 0){
                    queue.active.stamp = "undefined"
                    queue.active.user = "undefined"
                 
                    fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, "\t"))    
                    return interaction.reply({ content: `You have successfully left the queue.`, ephemeral: true })
                } else {
                    queue.active.stamp = helper.getUNIXStamp()
                    queue.active.user = queue.users[0].id
                    queue.users.splice(0, 1)
                     
                    fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, "\t"))
                    await interaction.reply({ content: `You have successfully left the queue.`, ephemeral: true })
                    return interaction.channel.send({
                        content: `<@${queue.active.user}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setDescription(`You have been moved and are now the active user in the queue.`)
                        ]
                    })
                }
            } else {
                for (let i = 0;i < queue.users.length;i++){
                    if (i === queue.users.length-1 && queue.users[i].id !== interaction.user.id) return interaction.reply({ content: `You are not part of the queue.`, ephemeral: true })
                    if (queue.users[i].id !== interaction.user.id) continue;

                    queue.users.splice(i, 1)
                }
              
                fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, "\t"))   
                return interaction.reply({ content: `You have successfully left the queue.`, ephemeral: true })
            }
        }

        if (interaction.options.getSubcommand() === "show"){
            if (queue.active.user === "undefiend") return interaction.reply({ content: `The queue is currently empty.`, ephemeral: true })
            
            let embedstring = ""
            for (let i = 0;i < queue.users.length;i++){
                embedstring += `${i+1}. <@${queue.users[i].id}> (<t:${queue.users[i].joined}:R>)\n`
            }

            if (embedstring.length > 1024) return interaction.reply({ content: "There has been an error creating the response embed.", ephemeral: true })

            return interaction.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle('Current Queue:')    
                    .setColor('Red')
                    .setDescription(`Active user: <@${queue.active.user}>\nSince: <t:${queue.active.stamp}:R>`)
                    .addFields({ name: "Waiting:" , value: `${embedstring ? embedstring : "empty"}` })
            ]})
        }

        if (interaction.options.getSubcommand() === "move"){
            let hasperms = interaction.member.permissions.has('ManageGuild')
            if (!hasperms && interaction.user.id !== "189764769312407552") return interaction.reply({ content: `Invalid authorisation`, ephemeral: true });
        
            if (queue.users.length === 0) return interaction.reply({ content:`The queue is currently empty.`, ephemeral: true })

            queue.active.stamp = helper.getUNIXStamp()
            queue.active.user = queue.users[0].id
            queue.users.splice(0, 1)
                
            fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, "\t"))
            await interaction.reply({ content: `You have successfully moved the queue.`, ephemeral: true })
            return interaction.channel.send({
                content: `<@${queue.active.user}>`,
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`You have been moved and are now the active user in the queue.`)
                ]
            })
        }
    }
}