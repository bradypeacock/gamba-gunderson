const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove_coins')
		.setDescription('Remove coins from anyone in the server. Admins only.')
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
		const balance = await users.getBalance(target.id);

		if (amount > balance)
		{
			const embed = new MessageEmbed()
				.setColor('#ff0000')
				.setDescription(`${target.username}#${target.discriminator} only has a balance of **${balance}** ${currency_emoji}, choose a number less than ${amount}`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}
		if (amount <= 0)
		{
			const embed = new MessageEmbed()
				.setColor('#ff0000')
				.setDescription(`Please enter an amount greater than zero, ${interaction.user}.`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		await users.add(target.id, -amount);

		const embed = new MessageEmbed()
			.setColor('#00ff00')
			.setDescription(`Removed **${amount}** ${currency_emoji} from ${target.username}#${target.discriminator}. New balance: **${users.getBalance(target.id)}** ${currency_emoji}`);
		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};