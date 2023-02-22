function getPoints(startingarray) {
    if (!startingarray[0]) return 0;
    let array = Array.from(startingarray);
    let points = 0;

    //remove unnecessary data, only values
    for (let i = 0; i < array.length; i++) {
        array[i] = array[i].replace("club", "").replace("heart", "").replace("spade", "").replace("diamond", "");
    }

    //move ace to the end of the hand to ensure we pick the right value
    if (array.includes("Ace")) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === "Ace") {
                array.splice(i, 1)
                array.push("Ace")
            }
        }
    }

    //add the points
    for (let i = 0; i < array.length; i++) {
        let value = array[i].replace("club", "").replace("heart", "").replace("spade", "").replace("diamond", "");
        switch (value) {
            case "Jack":
                points += 10;
                break;
            case "Queen":
                points += 10;
                break;
            case "King":
                points += 10;
                break;
            case "Ace":
                if ((points + 11) > 21) {
                    points += 1;
                } else {
                    points += 11;
                }
                break;
            default:
                points += parseInt(value);
                break;
        }
    }
    return points;
}

function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function stringifyArray(array) {
    if (!Array.isArray(array)) return array;
    let string = "";
    for (let i = 0; i < array.length; i++) {
        if (i == array.length - 1) { string += `${array[i].replace("spade", "♠️ ").replace("club", "♣️ ").replace("heart", "♥️ ").replace("diamond", "♦️ ")}` }
        else { string += `${array[i].replace("spade", "♠️ ").replace("club", "♣️ ").replace("heart", "♥️ ").replace("diamond", "♦️ ")}, ` };
    }
    return string;
}
//end of helper functions

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('play blackjack against a computer!'),
    async execute(interaction, Discord, client, version, helper, db_gen, db_ud) {
        interaction.reply({
            content: "Started blackjack game.",
            //ephemeral: true
        });

        const deck_start = [
            "club2", "club3", "club4", "club5", "club6", "club7", "club8", "club9", "club10", "clubJack", "clubQueen", "clubKing", "clubAce",
            "heart2", "heart3", "heart4", "heart5", "heart6", "heart7", "heart8", "heart9", "heart10", "heartJack", "heartQueen", "heartKing", "heartAce",
            "spade2", "spade3", "spade4", "spade5", "spade6", "spade7", "spade8", "spade9", "spade10", "spadeJack", "spadeQueen", "spadeKing", "spadeAce",
            "diamond2", "diamond3", "diamond4", "diamond5", "diamond6", "diamond7", "diamond8", "diamond9", "diamond10", "diamondJack", "diamondQueen", "diamondKing", "diamondAce"
        ];

        let deck_active = deck_start;
        let hand_player = []
        let hand_comp = []

        //roll player
        let roll_player = randomPick(deck_active)
        deck_active = deck_active.filter(function (e) { return e !== roll_player })
        hand_player.push(roll_player)

        //roll computer
        let roll_comp = randomPick(deck_active)
        deck_active = deck_active.filter(function (e) { return e !== roll_comp })
        hand_comp.push(roll_comp)

        var game_emb = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Blackjack Game`)
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
            .setColor('#2f3136')
            .setDescription(`Computer Hand: ${stringifyArray(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}`)
        interaction.channel.send({ embeds: [game_emb] }).then(msg => {
            //roll player
            let roll_player = randomPick(deck_active)
            deck_active = deck_active.filter(function (e) { return e !== roll_player })
            hand_player.push(roll_player)

            //roll computer
            let roll_comp = randomPick(deck_active)
            deck_active = deck_active.filter(function (e) { return e !== roll_comp })
            hand_comp.push(roll_comp)

            var game_emb = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Blackjack Game`)
                .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                .setColor('#2f3136')
                .setDescription(`Computer Hand: ${stringifyArray([hand_comp[0]])}, ||hidden||\nComputer Points: ${getPoints([hand_comp[0]])}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`)
            msg.edit({ embeds: [game_emb] }).then(msg => {
                if (getPoints(hand_player) === 21) {
                    try { msg.delete() } catch { };
                    var end_emb = new EmbedBuilder()
                        .setTitle(`Blackjack Win`)
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                        .setColor('#2f3136')
                        .setDescription(`\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                    return msg.channel.send({ embeds: [end_emb] })
                }
                msg.react("✅");
                msg.react("❌");

                const listener = async (reaction, user) => {
                    if (user.bot) return;
                    if (reaction.emoji.name === "✅" && (interaction.user.id === user.id) && (reaction.message.id === msg.id)) {
                        //roll player
                        let roll_player = randomPick(deck_active)
                        deck_active = deck_active.filter(function (e) { return e !== roll_player })
                        hand_player.push(roll_player)

                        if (getPoints(hand_player) > 21) {
                            msg.delete().catch((error) => {
                                console.log(error)
                            })

                            var end_emb = new EmbedBuilder()
                                .setTitle(`Blackjack Loss`)
                                .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                .setColor('#FF4D4D')
                                .setDescription(`You busted.\n\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`)
                            client.off("messageReactionAdd", listener)
                            return msg.channel.send({ embeds: [end_emb]  })
                        } else if (getPoints(hand_player) === 21) {
                            msg.delete().catch((error) => {
                                console.log(error)
                            })

                            var end_emb = new EmbedBuilder()
                                .setTitle(`Blackjack Win`)
                                .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                .setColor('#2f3136')
                                .setDescription(`\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                            client.off("messageReactionAdd", listener)
                            return msg.channel.send({ embeds: [end_emb] })
                        }

                        var game_emb = new EmbedBuilder()
                            .setTitle(`${interaction.user.username}'s Blackjack Game`)
                            .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                            .setColor('#2f3136')
                            .setDescription(`Computer Hand: ${stringifyArray([hand_comp[0]])}, ||hidden||\nComputer Points: ${getPoints([hand_comp[0]])}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`)
                        msg.edit({ embeds: [game_emb] })
                    }
                    if (reaction.emoji.name === "❌" && (interaction.user.id === user.id) && (reaction.message.id === msg.id)) {
                        client.off("messageReactionAdd", listener)
                        msg.reactions.removeAll();

                        if (getPoints(hand_player) < getPoints(hand_comp)) {
                            msg.delete().catch((error) => {
                                console.log(error)
                            })

                            var end_emb = new EmbedBuilder()
                                .setTitle(`Blackjack Loss`)
                                .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                .setColor('#FF4D4D')
                                .setDescription(`\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                            return msg.channel.send({ embeds: [end_emb] })
                        }

                        var game_emb = new EmbedBuilder()
                            .setTitle(`${interaction.user.username}'s Blackjack Game`)
                            .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                            .setColor('#2f3136')
                            .setDescription(`Computer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`)
                        msg.edit({ embeds: [game_emb] })

                        let repeat = setInterval(function () {
                            //roll computer
                            let roll_comp = randomPick(deck_active)
                            deck_active = deck_active.filter(function (e) { return e !== roll_comp })
                            hand_comp.push(roll_comp)

                            if (getPoints(hand_comp) > 21) {
                                msg.delete().catch((error) => {
                                    console.log(error)
                                })

                                var end_emb = new EmbedBuilder()
                                    .setTitle(`Blackjack Win`)
                                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                    .setColor('#2f3136')
                                    .setDescription(`\nThe Computer busted.\n\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                                clearInterval(repeat);
                                return msg.channel.send({ embeds: [end_emb] })
                            } else if (getPoints(hand_player) < getPoints(hand_comp)) {
                                try { msg.delete() } catch { }

                                var end_emb = new EmbedBuilder()
                                    .setTitle(`Blackjack Loss`)
                                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                    .setColor('#FF4D4D')
                                    .setDescription(`\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                                clearInterval(repeat);
                                return msg.channel.send({ embeds: [end_emb] })
                            } else if (getPoints(hand_player) === getPoints(hand_comp)) {
                                try { msg.delete() } catch { }

                                var end_emb = new EmbedBuilder()
                                    .setTitle(`Blackjack Draw`)
                                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                    .setColor('#2f3136')
                                    .setDescription(`\nThere is no winner.\n\nComputer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`);
                                clearInterval(repeat);
                                return msg.channel.send({ embeds: [end_emb] })
                            }

                            var game_emb = new EmbedBuilder()
                                .setTitle(`${interaction.user.username}'s Blackjack Game`)
                                .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983600.png")
                                .setColor('#2f3136')
                                .setDescription(`Computer Hand: ${stringifyArray(hand_comp)}\nComputer Points: ${getPoints(hand_comp)}\n\nPlayer Hand: ${stringifyArray(hand_player)}\nPlayer Points: ${getPoints(hand_player)}`)
                            msg.edit({ embeds: [game_emb] })
                        }, 2000);
                        return;
                    }

                    if (reaction.message.id == msg.id) {
                        try {
                            reaction.users.remove(user.id);
                        } catch { }
                    }
                    await new Promise(resolve => setTimeout(() => {
                        try {
                            client.off("messageReactionAdd", listener)
                        } catch { }
                        resolve();
                    }, 120000));
                }
                client.on("messageReactionAdd", listener)
            })
        })
    }
}