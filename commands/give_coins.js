const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give_coins')
		.setDescription('Give coins to anyone in the server. Admins only.')
		.addIntegerOption(option => option.setName('amount').setDescription('Amount').setRequired(true))
		.addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
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

		const currency_emoji = await game_info.get(1).emoji;

		const target = await interaction.options.getUser('member');
		const amount = await interaction.options.getInteger('amount');

		if (amount <= 0)
		{
			const embed = new MessageEmbed()
				.setColor('#ff0000')
				.setDescription(`Please enter an amount greater than zero, ${interaction.user}.`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		await users.add(target.id, amount);

		const embed = new MessageEmbed()
			.setColor('#00ff00')
			.setDescription(`${target.username}#${target.discriminator} has received **${amount}** ${currency_emoji}. New balance: **${users.getBalance(target.id)}** ${currency_emoji}`);
		await interaction.reply({ embeds: [embed] });
	},
};