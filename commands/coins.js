const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coins')
		.setDescription('Get the coins amount of anyone in the server')
		.addUserOption(option => option.setName('member').setDescription('Member').setRequired(false)),
	async execute(interaction)
	{
		const currency_emoji = await game_info.get(1).emoji;

		const target = interaction.options.getUser('member') ?? interaction.user;
		const coins = await users.getBalance(target.id);

		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`${target.username}#${target.discriminator} has ${coins} ${currency_emoji}`);
		await interaction.reply({ embeds: [embed] });
	},
};