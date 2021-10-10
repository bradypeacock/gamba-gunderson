const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { game_info, users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('games')
		.setDescription('Get more info about server\'s games'),
	async execute(interaction)
	{
		try
		{
			const currency_emoji = await game_info.get(1).emoji;
			const max_bet = await game_info.get(1).max_bet;

			const gamble_text = (max_bet) ?
				`You can gamble up to **${max_bet}** ${currency_emoji} for each game` :
				'There is no maximum bet, go crazy!';

			const fields = new Array();

			// Dice
			const dice_cd = await game_info.get(1).dice_cooldown;
			let dice_cd_min = 0;
			let dice_cd_sec = dice_cd;
			if (dice_cd >= 60)
			{
				dice_cd_min = Math.floor(dice_cd / 60);
				dice_cd_sec = dice_cd - (dice_cd_min * 60);
			}

			let dice_cd_text = '';
			if (dice_cd_min == 0 && dice_cd_sec == 0)
			{
				dice_cd_text = 'No cooldown! Go wild!';
			}
			else if (dice_cd_sec == 0)
			{
				dice_cd_text = `${dice_cd_min}m`;
			}
			else if (dice_cd_min == 0)
			{
				dice_cd_text = `${dice_cd_sec}s`;
			}
			else
			{
				dice_cd_text = `${dice_cd_min}m${dice_cd_sec}s`;
			}

			fields.push({ name: 'Dice', value: '`/dice <amount>`\n' +
				'Throw two dice and try to make more than your opponent to gain your bet. Make a double and win twice this amount. Make a double 6 and win three times this amount.\n' +
				'*gains: from x1 to x3 depending on your dice*\n' +
				`*cooldown: ${dice_cd_text}*` });

			// Add new games here

			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(gamble_text)
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