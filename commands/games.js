const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { game_info } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('games')
		.setDescription('Get more info about server\'s games'),
	async execute(interaction)
	{
		const currency_emoji = await game_info.get(1).emoji;
		const max_bet = await game_info.get(1).max_bet;

		const gamble_text = (max_bet) ?
			`You can gamble up to **${max_bet}** ${currency_emoji} for each game` :
			'There is no maximum bet, go crazy!';

		const fields = new Array();

		// Dice
		const dice_cd = await game_info.get(1).dice_cooldown;
		fields.push({ name: 'Dice', value: '`/dice <amount>`\n' +
			'Throw two dice and try to make more than your opponent to gain your bet. Make a double and win twice this amount. Make a double 6 and win three times this amount.\n' +
			'*gains: from x1 to x3 depending on your dice*\n' +
			`*cooldown: ${dice_cd}*` });

		// Add new games here

		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setDescription(gamble_text)
			.addFields(fields);
		await interaction.reply({ embeds: [embed] });
	},
};