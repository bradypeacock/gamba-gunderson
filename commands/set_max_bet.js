const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_max_bet')
		.setDescription('Set the maximum bet amount for games. Admins only.')
		.addIntegerOption(option => option.setName('amount').setDescription('Amount').setRequired(true)),
	async execute(interaction)
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

		const max = await interaction.options.getInteger('amount');

		if (max < 0)
		{
			const embed = new MessageEmbed()
				.setColor('#ff0000')
				.setDescription(`Please enter a positive integer, ${interaction.user}.`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		info.max_bet = max;

		await info.save();

		const embed = new MessageEmbed()
			.setColor('#00ff00')
			.setDescription(`Maximum bet has been set to ${max} ${currency_emoji}`);
		await interaction.reply({ embeds: [embed] });
	},
};