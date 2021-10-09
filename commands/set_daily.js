const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { game_info, users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_daily')
		.setDescription('Set the min/max daily reward. Admins only.')
		.addIntegerOption(option => option.setName('min').setDescription('Min daily reward').setRequired(true))
		.addIntegerOption(option => option.setName('max').setDescription('Max daily reward').setRequired(true)),
	async execute(interaction)
	{
		try
		{
			const isAdmin = await interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR]);
			if (!isAdmin)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`${interaction.user.username}, you cannot use admin commands`);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			const info = await game_info.get(1);
			const currency_emoji = info.emoji;

			const min = await interaction.options.getInteger('min');
			const max = await interaction.options.getInteger('max');

			if (min < 0)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Please enter a positive integer for the minimum, ${interaction.user}.`);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			if (max < 0)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Please enter a positive integer for the maximum, ${interaction.user}.`);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			if (max <= min)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`The maximum must be greater than the minimum, ${interaction.user}.`);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			info.daily_min = min;
			info.daily_max = max;

			await info.save();

			const embed = new MessageEmbed()
				.setColor('#00ff00')
				.setDescription(`Daily reward has been set to the range of ${min} ${currency_emoji} to ${max} ${currency_emoji}`);
			await interaction.reply({ embeds: [embed] });
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