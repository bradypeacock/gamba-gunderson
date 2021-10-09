const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { users, game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('transfer')
		.setDescription('Transfer coins to anyone in the server')
		.addIntegerOption(option => option.setName('amount').setDescription('Transfer amount').setRequired(true))
		.addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
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

			const target = await interaction.options.getUser('member');
			const coins = users.getBalance(interaction.user.id);
			const amount = await interaction.options.getInteger('amount');

			if (amount > coins)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Sorry ${interaction.user}, you only have **${coins}** ${currency_emoji}.`);
				await users.setPlaying(interaction.user.id, 0);
				return interaction.reply({ embeds: [embed] });
			}
			if (amount <= 0)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Please enter an amount greater than zero, ${interaction.user}.`);
				await users.setPlaying(interaction.user.id, 0);
				return interaction.reply({ embeds: [embed] });
			}

			if (target.id == interaction.user.id)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`You cannot transfer coins to yourself, ${interaction.user}.`);
				await users.setPlaying(interaction.user.id, 0);
				return interaction.reply({ embeds: [embed] });
			}

			await users.add(interaction.user.id, -amount);
			await users.add(target.id, amount);

			const embed = new MessageEmbed()
				.setColor('#00ff00')
				.setDescription(`Successfully transferred **${amount}** ${currency_emoji} to **${target.tag}**. Your current balance is **${users.getBalance(interaction.user.id)}** ${currency_emoji}`);

			await users.setPlaying(interaction.user.id, 0);
			return interaction.reply({ embeds: [embed] });
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