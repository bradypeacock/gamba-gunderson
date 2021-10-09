const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_currency')
		.setDescription('Set the currency name and symbol. Admins only.')
		.addStringOption(option => option.setName('name').setDescription('Name of currency').setRequired(true))
		.addStringOption(option => option.setName('symbol').setDescription('Currency symbol').setRequired(true)),
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

		const name = await interaction.options.getString('name');
		const emoji = await interaction.options.getString('symbol');

		info.name = name;
		info.emoji = emoji;

		await info.save();

		const embed = new MessageEmbed()
			.setColor('#00ff00')
			.setDescription(`Currency has been set to ${name} ${emoji}`);
		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};