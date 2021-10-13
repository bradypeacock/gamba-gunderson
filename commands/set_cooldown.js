const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { game_info, users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_cooldown')
		.setDescription('Set the cooldown of a game. Admins only.')
		.addIntegerOption(option => option.setName('cooldown').setDescription('Cooldown (in seconds)').setRequired(true))
		.addStringOption(option =>
			option.setName('game')
				.setDescription('The game to set the cooldown of')
				.setRequired(true)
				.addChoice('dice', 'dice')
				.addChoice('rps', 'rps')),
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
			const cooldown = await interaction.options.getInteger('cooldown');
			const game = await interaction.options.getString('game');

			if (cooldown < 0)
			{
				const embed = new MessageEmbed()
					.setColor('#ff0000')
					.setDescription(`Please enter a positive integer, ${interaction.user}.`);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}

			if (game == 'dice')
			{
				info.dice_cooldown = cooldown;
			}
			else if (game == 'rps')
			{
				info.rps_cooldown = cooldown;
			}

			await info.save();

			const embed = new MessageEmbed()
				.setColor('#00ff00')
				.setDescription(`Cooldown for game \`${game}\` has been set to ${cooldown} seconds.`);
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