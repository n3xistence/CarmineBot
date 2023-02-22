const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresheventtask')
        .setDescription('refreshes your current event task and progress'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        //get data
        let link_data = db_gen.prepare(`SELECT * FROM links WHERE Discord_ID=?`).get(interaction.user.id);
        if (!link_data) return interaction.reply({ content: "You are not linked. Run /gverify to link your account.", ephemeral: true });
        let link = link_data.SMMO_ID;

        let user_event_data = db_gen.prepare(`SELECT * FROM EventData WHERE id=?`).get(link);
        if (!user_event_data) return interaction.reply({ content: "You do not currently have a task. Please wait a few minutes and try again.\nIf the problem persists, please contact n3xistence#0003", ephemeral: true });
        if (user_event_data.has_completed == 1) return interaction.reply({ content: `You have already completed your quest for today.`, ephemeral: true })

        let user_data = db_ud.prepare(`select name from sqlite_master where type='table'`).all()
            .filter(elem => elem.name.startsWith("ud"))
            .map(elem => elem.name.replace(/\_/g, "-").replace("ud", ""));

        user_data.sort(function (a, b) {
            return new Date(helper.date_to_ISO8601(a)) - new Date(helper.date_to_ISO8601(b));
        })

        let data_now = db_ud.prepare(`SELECT * FROM UserDataLive WHERE id=?`).get(link);
        if (!data_now) return interaction.reply({ content: "Missing Data entry.\nIf the problem persists, please contact n3xistence#0003", ephemeral: true });;

        if (user_event_data.type !== "players") return interaction.reply({ content:`You can only refresh PVP tasks.`,ephemeral: true })
        if (data_now.safemode != 1) return interaction.reply({ content:`You are currently not in safemode and cannot refresh this task.`,ephemeral: true })

        //refresh task
        //possible quests, [0] = type, [1] = description
        const quest_levels = ["levels", "gain", 60, 75, 90]
        const quest_steps = ["steps", "take", 150, 300, 450]
        const quest_npc = ["NPCs", "kill", 90, 110, 130]
        const quest_pvp = ["players", "kill", 35, 40, 45]
        const quest_quests = ["quests", "complete", 60, 75, 90]
        const quest_tasks = ["tasks", "complete", 3, 4, 5]

        //create array of all quests
        const quests_list = [quest_steps, quest_levels, quest_quests, quest_npc, quest_pvp, quest_tasks]

        let quest = {
            type: "",
            value: "",
            description: ""
        }

        let quest_pick = Math.floor(Math.random() * quests_list.length);

        //quest roll
        let roll = Math.floor(Math.random() * (quests_list[quest_pick].length - 2)) + 2;
        quest.type = quests_list[quest_pick][0];
        quest.value = quests_list[quest_pick][roll];
        quest.description = `${quests_list[quest_pick][1]} ${quest.value} ${quest.type}`;

        if (quest.type === "players") quest.type === "PVP";

        let cmd = db_gen.prepare(`UPDATE EventData SET type=?, value=?, description=? WHERE id=?`)
        cmd.run(
            quest.type,
            quest.value,
            quest.description,
            link
        )
        
        return interaction.reply({
            content:`❄️ ┊ Your task has been refreshed.`,
            ephemeral: true
        })

    }
}