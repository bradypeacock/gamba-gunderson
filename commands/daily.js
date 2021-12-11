const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');
const { random } = require('../random.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Claim your daily reward'),
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

			const info = await game_info.get(1);
			const currency_emoji = info.emoji;

			const daily_claimed = await users.getDaily(interaction.user.id);
			const date = new Date();

			let streak = await users.getStreak(interaction.user.id);
			let streak_bonus = 1;
			let streak_continued = false;

			// Not first time claiming
			if (daily_claimed)
			{
				// Find out if the streak has been continued or not and act accordingly
				const lastDate = new Date();
				// Add one day to the last date and set new date. This method accounts for new month/year.
				lastDate.setDate(daily_claimed.getDate() + 1);
				// If 'lastDate' is equal to today, then the last time we got our daily was yesterday, meaning our streak will continue
				// Otherwise, it wasn't yesterday and we broke the streak
				streak_continued = (lastDate.getDate() == date.getDate()) && (lastDate.getMonth() == date.getMonth()) && (lastDate.getFullYear() == date.getFullYear());
				if (streak_continued)
				{
					// 0.5x reward per daily streak for a max of 4x at 7 days
					streak_bonus = 1 + 0.5 * ((streak > 7 ? 7 : streak) - 1);
				}
				else
				{
					streak = 1;
				}
			}

			// Reward = random number between daily min/max * streak bonus
			const reward = Math.ceil(random(info.daily_min, info.daily_max) * streak_bonus);

			// If user has claimed their daily reward before the timestamp will be saved in daily_claimed
			if (daily_claimed)
			{
				// If it's the same day since they last claimed
				if ((daily_claimed.getDate() == date.getDate()) && (daily_claimed.getMonth() == date.getMonth()) && (daily_claimed.getFullYear() == date.getFullYear()))
				{
					let hours = 23 - date.getHours();
					let minutes = 60 - date.getMinutes();

					if (minutes == 60)
					{
						hours++;
						minutes = 0;
					}

					let desc = '';
					const plural_h = (hours > 1 ? 'hours' : 'hour');
					const plural_m = (minutes > 1 ? 'minutes' : 'minute');
					if (hours == 0)
					{
						desc = `${interaction.user} you can't claim more than once per day. You need to wait **${minutes} ${plural_m}** to claim again.`;
					}
					else if (minutes == 0)
					{
						desc = `${interaction.user} you can't claim more than once per day. You need to wait **${hours} ${plural_h}** to claim again.`;
					}
					else
					{
						desc = `${interaction.user} you can't claim more than once per day. You need to wait **${hours} ${plural_h} and ${minutes} ${plural_m}** to claim again.`;
					}

					const embed = new MessageEmbed()
						.setColor('#ff0000')
						.setDescription(desc);
					await interaction.reply({ embeds: [embed] });
				}
				// Not the same day, give them their reward
				else
				{
					let desc = '';
					if (streak == 1)
					{
						desc = `${interaction.user}, here is your daily reward: ${reward} ${currency_emoji}`;
					}
					else
					{
						desc = `${interaction.user}, **${streak} days** in a row! Here is your daily reward with your streak bonus of **${streak_bonus}x**: ${reward} ${currency_emoji}`;
					}
					const embed = new MessageEmbed()
						.setColor('#0099ff')
						.setDescription(desc);
					await interaction.reply({ embeds: [embed] });
					await users.add(interaction.user.id, reward);
					await users.setDaily(interaction.user.id, date);
					if (!streak_continued) await users.resetStreak(interaction.user.id);
					await users.incStreak(interaction.user.id);
				}
			}
			// First time claiming
			else
			{
				const embed = new MessageEmbed()
					.setColor('#0099ff')
					.setDescription(`${interaction.user}, here is your daily reward: ${reward} ${currency_emoji}`);
				await interaction.reply({ embeds: [embed] });
				await users.add(interaction.user.id, reward);
				await users.setDaily(interaction.user.id, date);
				await users.incStreak(interaction.user.id);
			}

			await users.setPlaying(interaction.user.id, 0);
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