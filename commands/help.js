const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get the list of available commands'),
	async execute(interaction)
	{
		try
		{
			const commands = [];
			const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

			for (const file of commandFiles)
			{
				const command = require(`./${file}`);
				commands.push(command.data.toJSON());
			}

			let desc = '';
			for (const command of commands)
			{
				let name = `\`/${command.name} `;

				for (const option of command.options)
				{
					if (option.required == true)
					{
						name += `[${option.name}] `;
					}
					else
					{
						name += `(optional ${option.name}) `;
					}
				}

				name += '`';

				desc += name;
				desc += '\n';
				desc += command.description;
				desc += '\n\n';
			}

			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Help Commands')
				.setDescription(desc);
			try
			{
				await interaction.user.send({ embeds: [embed] });
				await interaction.reply(`${interaction.user.username}, check your messages for a list of available commands.`);
			}
			catch
			{
				await interaction.reply(`${interaction.user.username}, you must be able to receive direct messages to get a list of available commands.`);
			}
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