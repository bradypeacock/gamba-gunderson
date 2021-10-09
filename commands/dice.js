const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { sleep } = require('../sleep.js');
const { random } = require('../random.js');
const { users, game_info } = require('../dbObjects.js');

function roll()
{
	return random(1, 6);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('Bet on a dice roll')
		.addIntegerOption(option => option.setName('amount').setDescription('Bet amount').setRequired(true)),
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
			const cooldown = await game_info.get(1).dice_cooldown * 1000;

			const lastUse = await users.getCooldown(interaction.user.id, 'dice');
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

			// Player dice data
			const p_r1 = roll();
			const p_r2 = roll();
			const p_tot = p_r1 + p_r2;

			// Opponent dice data
			const o_r1 = roll();
			const o_r2 = roll();
			const o_tot = o_r1 + o_r2;

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
				await interaction.reply(`:game_die: **${interaction.user.username}** has challenged **${opponent.username}** with a bet of **${amount}** ${currency_emoji}.`);
				await interaction.channel.send({ content: `${opponent}, do you accept?`, components: [row] });
			}
			else
			{
				await interaction.reply(`:game_die: ${interaction.user.username} bets ${amount} ${currency_emoji} and rolls their dice...`);
				await sleep(2000);
				await interaction.channel.send(`:game_die: ${interaction.user.username} gets **${p_r1}** and **${p_r2}**...`);
				await sleep(2000);
				if (p_tot == 12)
				{
					await interaction.channel.send(`:game_die: :astonished: ${interaction.user.username} rolls **two 6s**! Their opponent is afraid and gives up. ${interaction.user.username} won ${amount * 3} ${currency_emoji}!`);
					await users.add(interaction.user.id, amount * 3);
				}
				else
				{
					await interaction.channel.send(`:game_die: ${interaction.user.username}, your opponent rolls their dice and gets **${o_r1}** and **${o_r2}**...`);
					await sleep(2000);
					if (p_tot > o_tot)
					{
						if (p_r1 == p_r2)
						{
							await interaction.channel.send(`:game_die: ${interaction.user.username}, you rolled a double and **won** twice your bet: ${amount * 2} ${currency_emoji}`);
							await users.add(interaction.user.id, amount * 2);
						}
						else
						{
							await interaction.channel.send(`:game_die: ${interaction.user.username}, you **won** ${amount} ${currency_emoji}!`);
							await users.add(interaction.user.id, amount);
						}
					}
					else if (p_tot < o_tot)
					{
						await interaction.channel.send(`:game_die: ${interaction.user.username}, you **lost** ${amount} ${currency_emoji}`);
						await users.add(interaction.user.id, -amount);
					}
					else
					{
						await interaction.channel.send(`:game_die: ${interaction.user.username}, it's a draw, you get back ${amount} ${currency_emoji}`);
					}
				}
			}

			await users.setCooldown(interaction.user.id, 'dice', Date.now());
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