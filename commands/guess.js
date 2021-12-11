const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { random } = require('../random.js');
const { users, game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guess')
		.setDescription('Guess a number between 1 and 100')
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
			const cooldown = await game_info.get(1).guess_cooldown * 1000;

			const lastUse = await users.getCooldown(interaction.user.id, 'guess');
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

			const game_emoji = ':thinking:';

			// Random number to be guessed
			const num = random(1, 100);
			let attempts_left = 5;

			await interaction.reply(`${game_emoji} ${interaction.user.username} bets ${amount} ${currency_emoji} and starts the mystery machine...`);
			await interaction.channel.send(`${game_emoji} ${interaction.user.username}, the mystery machine is ready, you have **5 attempts** to guess the number **between 1 and 100**... type your answer`);

			const filter = (msg) =>
			{
				const number = parseInt(msg.content);
				return ((msg.author.id == interaction.user.id) && (!isNaN(number)) && (number >= 1) && (number <= 100));
			};
			const collector = interaction.channel.createMessageCollector({ filter, max: 5, time: 15000 });

			collector.on('collect', async msg =>
			{
				const number = parseInt(msg.content);

				if (number == num)
				{
					collector.stop('won');
				}
				else if (number > num)
				{
					attempts_left--;
					if (attempts_left > 0)
					{
						let attempt_str = 'attempts';
						if (attempts_left == 1) attempt_str = 'attempt';
						await interaction.channel.send(`${game_emoji} ${interaction.user.username}, the number you are looking for is **less than ${number}**\n*${attempts_left} ${attempt_str} left*`);
					}
				}
				else if (number < num)
				{
					attempts_left--;
					if (attempts_left > 0)
					{
						let attempt_str = 'attempts';
						if (attempts_left == 1) attempt_str = 'attempt';
						await interaction.channel.send(`${game_emoji} ${interaction.user.username}, the number you are looking for is **greater than ${number}**\n*${attempts_left} ${attempt_str} left*`);
					}
				}

				collector.resetTimer({ time: 15000 });
			});

			collector.on('end', async (collected, reason) =>
			{
				await users.setCooldown(interaction.user.id, 'guess', Date.now());
				await users.setPlaying(interaction.user.id, 0);
				console.log(`Collected ${collected.size} interactions.`);

				if (reason == 'time')
				{
					return interaction.channel.send(`:timer: ${interaction.user.username} has ran out of time and stopped guessing! They lost ${amount} ${currency_emoji}`);
				}
				else if (reason == 'won')
				{
					// Rewards the player with:
					//    0.5x for 5 attempts (0 left)
					//    1x for 4 attempts (1 left)
					//    2x for 3 attempts (2 left)
					//    5x for 2 attempts (3 left)
					//    10x for 1 attempt (4 left)
					// index with "attempts_left - 1"
					const multiplier = [ 0.5, 1.0, 2.0, 5.0, 10.0 ];

					const tot_attempts = 5 - (attempts_left - 1);

					let attempt_str = 'attempts';
					if (tot_attempts == 1) attempt_str = 'attempt';

					await interaction.channel.send(`${game_emoji} ${interaction.user.username}, you won ${Math.ceil(amount * multiplier[attempts_left - 1])} ${currency_emoji} in **${tot_attempts} ${attempt_str}**!`);
					await users.add(interaction.user.id, amount);
				}
				else if (reason == 'limit')
				{
					await interaction.channel.send(`${game_emoji} ${interaction.user.username}, you did not find the number and lost ${amount} ${currency_emoji}! The number was ${num}.`);
					await users.add(interaction.user.id, -amount);
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