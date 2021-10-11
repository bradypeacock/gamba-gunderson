const { SlashCommandBuilder } = require('@discordjs/builders');
const { users, game_info } = require('../dbObjects.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('richest')
		.setDescription('Display a leaderboard of the richest people in the server.'),
	async execute(interaction)
	{
		try
		{
			const currency_emoji = await game_info.get(1).emoji;

			// Get server total by adding up all balances
			let total = 0;
			const [cached] = users.partition(user => interaction.client.users.cache.has(user.user_id));
			cached.every(b => total += b.balance);

			// Sort all balances and grab the top 10
			const list = users.sort((a, b) => b.balance - a.balance)
				.filter(user => interaction.client.users.cache.has(user.user_id))
				.first(10);

			// Make an array to hold the text for embed fields
			// First field shows server total, then they will show the top 10 users in order
			const fields = new Array();
			fields.push({ name: ':bank: **Server total**', value: `${currency_emoji} ${total}` });
			// We are doing it this way instead of just a .map() on 'list' because 1st, 2nd, and 3rd place will have unique text with the medals
			// and I'm new so this is the best way I know how
			for (let i = 0; i < list.length; i++)
			{
				if (i == 0)
				{
					fields.push({ name: `:first_place: **${(interaction.client.users.cache.get(list[i].user_id).username)}**`, value: `${currency_emoji} ${list[i].balance}` });
				}
				else if (i == 1)
				{
					fields.push({ name: `:second_place: **${(interaction.client.users.cache.get(list[i].user_id).username)}**`, value: `${currency_emoji} ${list[i].balance}` });
				}
				else if (i == 2)
				{
					fields.push({ name: `:third_place: **${(interaction.client.users.cache.get(list[i].user_id).username)}**`, value: `${currency_emoji} ${list[i].balance}` });
				}
				else
				{
					fields.push({ name: `**${i + 1} - ${(interaction.client.users.cache.get(list[i].user_id).username)}**`, value: `${currency_emoji} ${list[i].balance}` });
				}
			}

			// Create the embed and send the reply
			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`${interaction.guild.name} Richest Players`)
				.addFields(fields);
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