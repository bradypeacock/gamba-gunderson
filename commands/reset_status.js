const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset_status')
		.setDescription('Help a user who\'s stuck. Admins only.')
		.addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
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

			const user = await interaction.options.getUser('member');

			users.setPlaying(user.id, 0);

			const embed = new MessageEmbed()
				.setColor('#00ff00')
				.setDescription(`${user}'s status has been reset!`);
			await interaction.reply({ embeds: [embed], ephemeral: true });
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