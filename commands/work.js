const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');
const { random } = require('../random.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Work for one hour and claim a paycheck'),
	async execute(interaction)
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

		const paycheck = await users.getPaycheck(interaction.user.id);
		const nextPaycheck = random(info.work_min, info.work_max);

		// Work every hour
		// 1 hour * 60 minutes/hr * 60 seconds/min * 1000 millseconds/sec
		const cooldown = 1 * 60 * 60 * 1000;

		const lastUse = await users.getCooldown(interaction.user.id, 'work');
		const timeLeft = cooldown - (Date.now() - lastUse);
		if (lastUse !== null && timeLeft > 0)
		{
			// If time left is greater than 1 minute (60 seconds)
			if (timeLeft > 60 * 1000)
			{
				// Time left in ms / 1000 milliseconds/sec / 60 seconds/min
				const minutesLeft = Math.round(timeLeft / 1000 / 60);
				const plural = (minutesLeft > 1 ? 'minutes' : 'minute');
				if (minutesLeft == 60)
				{
					await users.setPlaying(interaction.user.id, 0);
					const embed = new MessageEmbed()
						.setColor('#ff0000')
						.setDescription(`**${interaction.user.username}**, you are already working. Come back in 1 hour to claim your paycheck of **${paycheck}** ${currency_emoji}.`);
					return interaction.reply({ embeds: [embed] });
				}
				else
				{
					await users.setPlaying(interaction.user.id, 0);
					const embed = new MessageEmbed()
						.setColor('#ff0000')
						.setDescription(`**${interaction.user.username}**, you are already working. Come back in ${minutesLeft} ${plural} to claim your paycheck of **${paycheck}** ${currency_emoji}.`);
					return interaction.reply({ embeds: [embed] });
				}
			}
			// Time left is in the range of seconds in this case (less than a minute)
			else
			{
				// Time left in ms / 1000 milliseconds/sec
				const secondsLeft = timeLeft / 1000;
				if (secondsLeft == 1.00)
				{
					await users.setPlaying(interaction.user.id, 0);
					const embed = new MessageEmbed()
						.setColor('#ff0000')
						.setDescription(`**${interaction.user.username}**, you are already working. Come back in 1 second to claim your paycheck of **${paycheck}** ${currency_emoji}.`);
					return interaction.reply({ embeds: [embed] });
				}
				else
				{
					await users.setPlaying(interaction.user.id, 0);
					const embed = new MessageEmbed()
						.setColor('#ff0000')
						.setDescription(`**${interaction.user.username}**, you are already working. Come back in ${secondsLeft} seconds to claim your paycheck of **${paycheck}** ${currency_emoji}.`);
					return interaction.reply({ embeds: [embed] });
				}
			}
		}

		if (paycheck == 0)
		{
			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`${interaction.user}, you started working. Come back in **1 hour** to claim your paycheck of **${nextPaycheck}** ${currency_emoji} with \`/work\` and start another shift.`);
			await interaction.reply({ embeds: [embed] });
		}
		else
		{
			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(`${interaction.user}, you started working again. You gain **${paycheck}** ${currency_emoji} from your last shift! Come back in **1 hour** to claim your next paycheck of **${nextPaycheck} ${currency_emoji}** with \`/work\` and start another shift.`);
			await interaction.reply({ embeds: [embed] });
			await users.add(interaction.user.id, paycheck);
		}

		await users.setPaycheck(interaction.user.id, nextPaycheck);
		await users.setPlaying(interaction.user.id, 0);
		await users.setCooldown(interaction.user.id, 'work', Date.now());
	},
};