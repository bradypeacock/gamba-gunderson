const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { sleep } = require('../sleep.js');
const { random } = require('../random.js');
const { users, game_info } = require('../dbObjects.js');

let collector_working = false;

function setWorking(working)
{
	collector_working = working;
	return new Promise(resolve => resolve());
}

function getWorking()
{
	return new Promise(resolve => resolve(collector_working));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roulette')
		.setDescription('Play Russian Roulette to try and gain coins')
		.addIntegerOption(option => option.setName('amount').setDescription('Bet amount').setRequired(true)),
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
			const cooldown = await game_info.get(1).roulette_cooldown * 1000;

			const lastUse = await users.getCooldown(interaction.user.id, 'roulette');
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

			const game_emoji = ':persevere::gun:';

			// Random number to be guessed
			let chambers_left = 6;
			const multipliers = [ 0.1, 0.2, 0.5, 0.7, 1.5];
			let round = 0;
			let bullet = random(1, chambers_left--);
			let total_amount = amount;

			// This game is going to immediately take the money out since the total amount fluctuates. Easier to keep track of
			// This is probably how it should be done for other games, anyways, but I'm not going to change those because they work fine and I'm lazy.
			await users.add(interaction.user.id, -total_amount);

			await interaction.reply(`${game_emoji} ${interaction.user.username} bets ${total_amount} ${currency_emoji} and pulls the trigger...`);
			await sleep(2000);
			if (bullet != 1)
			{
				bullet = random(1, chambers_left--);
				total_amount += Math.round(amount * multipliers[round++]);
				const next_amount = total_amount + Math.round(amount * multipliers[round]);
				await users.add(interaction.user.id, total_amount);
				await interaction.channel.send(`:hot_face: ${interaction.user.username} wins back ${total_amount} ${currency_emoji}`);
				await interaction.channel.send(`${interaction.user.username}, type **continue** to bet your gains and try to win ${next_amount} ${currency_emoji}, or **end** to stop the roulette`);
			}
			else
			{
				await users.setCooldown(interaction.user.id, 'guess', Date.now());
				await users.setPlaying(interaction.user.id, 0);
				return interaction.channel.send(`:skull_crossbones: ${interaction.user.username} loses ${amount} ${currency_emoji}`);
			}

			const filter = (msg) =>
			{
				return ((msg.author.id == interaction.user.id) && ((msg.content.toLowerCase() == 'continue') || (msg.content.toLowerCase() == 'end')));
			};
			const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

			await setWorking(false);
			let isWorking = await getWorking();
			collector.on('collect', async (msg) =>
			{
				isWorking = await getWorking();
				if (msg.content.toLowerCase() == 'continue' && !isWorking)
				{
					collector.resetTimer({ time: 30000 });
					await setWorking(true);
					await users.add(interaction.user.id, -total_amount);
					await interaction.channel.send(`${game_emoji} ${interaction.user.username} bets ${total_amount} ${currency_emoji} and pulls the trigger...`);
					await sleep(2000);
					if (bullet != 1)
					{
						bullet = random(1, chambers_left--);
						total_amount += Math.round(amount * multipliers[round++]);
						const next_amount = total_amount + Math.round(amount * multipliers[round]);
						await users.add(interaction.user.id, total_amount);
						if (chambers_left > 0)
						{
							await interaction.channel.send(`:hot_face: ${interaction.user.username} wins back ${total_amount} ${currency_emoji}`);
							await interaction.channel.send(`${interaction.user.username}, type **continue** to bet your gains and try to win ${next_amount} ${currency_emoji}, or **end** to stop the roulette`);
						}
					}
					else
					{
						collector.stop('died');
					}

					if (chambers_left == 0)
					{
						collector.stop('won');
					}

					await setWorking(false);
				}
				else if (msg.content.toLowerCase() == 'end' && !isWorking)
				{
					await setWorking(true);
					collector.stop('ended');
					await setWorking(false);
				}
			});

			collector.on('end', async (collected, reason) =>
			{
				await users.setCooldown(interaction.user.id, 'guess', Date.now());
				await users.setPlaying(interaction.user.id, 0);
				console.log(`Collected ${collected.size} interactions.`);

				if (reason == 'time')
				{
					return interaction.channel.send(`:timer: ${interaction.user.username}, the roulette has ended (ran out of time). You finished with total gains of ${total_amount - amount} ${currency_emoji}`);
				}
				else if (reason == 'died')
				{
					return interaction.channel.send(`:skull_crossbones: ${interaction.user.username} loses ${total_amount} ${currency_emoji}`);
				}
				else if (reason == 'won')
				{
					return interaction.channel.send(`:four_leaf_clover: Amazing! ${interaction.user.username}, you won all rounds and gained ${total_amount} ${currency_emoji}!`);
				}
				else if (reason == 'ended')
				{
					return interaction.channel.send(`:baby: ${interaction.user.username} is a baby and decided to end the roulette. They gained ${total_amount} ${currency_emoji}`);
				}
				else
				{
					console.log(`Collector stopped for an unexpected reason: ${reason}`);
				}
			});
		}
		catch (error)
		{
			console.error(error);
			users.every(async user =>
			{
				await users.setPlaying(user.id, 0);
			});
		}
	},
};