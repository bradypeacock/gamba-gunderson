const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { sleep } = require('../sleep.js');
const { random } = require('../random.js');
const { users, game_info } = require('../dbObjects.js');

const ROCK = 0;
const PAPER = 1;
const SCISSORS = 2;

const rps_map =
{
	'rock': ROCK,
	'paper': PAPER,
	'scissors': SCISSORS,
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Bet on rock/paper/scissors')
		.addIntegerOption(option => option.setName('amount').setDescription('Bet amount').setRequired(true))
		.addStringOption(option =>
			option.setName('sign')
				.setDescription('Rock, Paper, or Scissors')
				.setRequired(true)
				.addChoice('rock', 'rock')
				.addChoice('paper', 'paper')
				.addChoice('scissors', 'scissors')),
	// .addUserOption(option => option.setName('opponent').setDescription('Optional user opponent').setRequired(false)),
	async execute(interaction)
	{
		try
		{
			if (await users.getPlaying(interaction.user.id) == 1)
			{
				return interaction.reply({ content: `:no_entry_sign: **${interaction.user.username}**, you are already in the middle of an action`, ephemeral: true });
			}
			else
			{
				await users.setPlaying(interaction.user.id, 1);
			}

			const currency_emoji = await game_info.get(1).emoji;
			const max_bet = await game_info.get(1).max_bet;
			// convert cooldown from seconds to milliseconds
			const cooldown = await game_info.get(1).rps_cooldown * 1000;

			const lastUse = await users.getCooldown(interaction.user.id, 'rps');
			const timeLeft = cooldown - (Date.now() - lastUse);
			if (lastUse !== null && timeLeft > 0)
			{
				await users.setPlaying(interaction.user.id, 0);
				// If there is more than a minute left (measure in minutes)
				if (timeLeft / 1000 > 60)
				{
					return interaction.reply(`:no_entry_sign: **${interaction.user.username}**, you need to wait ${Math.ceil(timeLeft / 1000 / 60)} minutes to use that command again.`);
				}
				// There is less than a minute left (measure in seconds)
				else
				{
					return interaction.reply(`:no_entry_sign: **${interaction.user.username}**, you need to wait ${timeLeft / 1000} seconds to use that command again.`);
				}
			}

			const amount = await interaction.options.getInteger('amount');
			if (amount <= 0)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Please enter an amount greater than zero, ${interaction.user}.`);
				await users.setPlaying(interaction.user.id, 0);
				return interaction.reply({ embeds: [embed] });
			}
			else if (amount > max_bet && max_bet != 0)
			{
				await users.setPlaying(interaction.user.id, 0);
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`:no_entry_sign: ${interaction.user}, you can't gamble more than ${max_bet} ${currency_emoji}`);
				return interaction.reply({ embeds: [embed] });
			}
			else if (amount > await users.getBalance(interaction.user.id))
			{
				await users.setPlaying(interaction.user.id, 0);
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`:no_entry_sign: ${interaction.user}, you don't have enough coins to gamble this amount`);
				return interaction.reply({ embeds: [embed] });
			}

			// const opponent = interaction.options.getUser('opponent');
			// interaction.client.opponent = opponent;
			const opponent = false;

			const game_emoji = ':rock::page_facing_up::scissors:';
			const rps_emojis = [':right_fist: (rock)', ':raised_hand: (paper)', ':v: (scissors)'];

			// Player rps sign
			const p_rps = rps_map[await interaction.options.getString('sign')];

			// Opponent rps sign
			const o_rps = await random(ROCK, SCISSORS);

			if (opponent)
			{
				const row = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('accept')
							.setLabel('Accept')
							.setStyle('SUCCESS'),
						new MessageButton()
							.setCustomId('decline')
							.setLabel('Decline')
							.setStyle('DANGER'),
					);
				await interaction.reply(`${game_emoji} **${interaction.user.username}** has challenged **${opponent.username}** with a bet of **${amount}** ${currency_emoji}.`);
				await interaction.channel.send({ content: `${opponent}, do you accept?`, components: [row] });
			}
			else
			{
				await interaction.reply(`${game_emoji} ${interaction.user.username} bets ${amount} ${currency_emoji}. Rock, paper, scissors...`);
				await sleep(2000);
				await interaction.channel.send(`${game_emoji} GO! ${interaction.user.username} plays ${rps_emojis[p_rps]}, their opponent plays ${rps_emojis[o_rps]}`);
				await sleep(2000);
				if (p_rps == o_rps)
				{
					await interaction.channel.send(`${game_emoji} ${interaction.user.username}, it's a **draw**, you get back ${amount} ${currency_emoji}`);
				}
				// Player win conditions
				else if (p_rps == ROCK && o_rps == SCISSORS)
				{
					await interaction.channel.send(`${game_emoji} Rock destroys scissors, ${interaction.user.username} **won** ${amount} ${currency_emoji}!`);
					await users.add(interaction.user.id, amount);
				}
				else if (p_rps == PAPER && o_rps == ROCK)
				{
					await interaction.channel.send(`${game_emoji} Paper covers rock, ${interaction.user.username} **won** ${amount} ${currency_emoji}!`);
					await users.add(interaction.user.id, amount);
				}
				else if (p_rps == SCISSORS && o_rps == PAPER)
				{
					await interaction.channel.send(`${game_emoji} Scissors cut paper, ${interaction.user.username} **won** ${amount} ${currency_emoji}!`);
					await users.add(interaction.user.id, amount);
				}
				// Opponent win conditions
				else if (p_rps == ROCK && o_rps == PAPER)
				{
					await interaction.channel.send(`${game_emoji} Paper covers rock, ${interaction.user.username} **lost** ${amount} ${currency_emoji}`);
					await users.add(interaction.user.id, -amount);
				}
				else if (p_rps == PAPER && o_rps == SCISSORS)
				{
					await interaction.channel.send(`${game_emoji} Scissors cut paper, ${interaction.user.username} **lost** ${amount} ${currency_emoji}`);
					await users.add(interaction.user.id, -amount);
				}
				else if (p_rps == SCISSORS && o_rps == ROCK)
				{
					await interaction.channel.send(`${game_emoji} Rock destroys scissors, ${interaction.user.username} **lost** ${amount} ${currency_emoji}`);
					await users.add(interaction.user.id, -amount);
				}
			}

			await users.setCooldown(interaction.user.id, 'rps', Date.now());
			await users.setPlaying(interaction.user.id, 0);
		}
		catch
		{
			users.every(async user =>
			{
				await users.setPlaying(user.id, 0);
			});
		}
	},
};