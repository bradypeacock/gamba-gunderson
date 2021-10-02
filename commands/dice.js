const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');

// FIXME: make this not hardcoded later
const currency_emoji = ':coin:';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('Bet on a dice roll')
		.addIntegerOption(option => option.setName('amount').setDescription('Bet amount').setRequired(true))
		.addUserOption(option => option.setName('opponent').setDescription('Optional user opponent').setRequired(false)),
	async execute(interaction)
	{
		const amount = interaction.options.getInteger('amount');
		const opponent = interaction.options.getUser('opponent');
		if (opponent)
		{
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('accept')
						.setLabel('Accept')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId('decline')
						.setLabel('Decline')
						.setStyle('DANGER'),
				);

			await interaction.reply(`:game_die: **${interaction.user.username}** has challenged **${opponent.username}** with a bet of **${amount}** ${currency_emoji}.`);
			await interaction.channel.send({ content: `${opponent}, do you accept?`, components: [row] });
		}
		else
		{
			await interaction.reply(`:game_die: **${interaction.user.username}** bets **${amount}** ${currency_emoji} and rolls their dice...`);
		}
		// FIXME: still need to create currency database and implement the dice rolls
	},
};