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

			// Rock, Paper, Scissors
			const rps_cd = await game_info.get(1).rps_cooldown;
			let rps_cd_min = 0;
			let rps_cd_sec = rps_cd;
			if (rps_cd >= 60)
			{
				rps_cd_min = Math.floor(rps_cd / 60);
				rps_cd_sec = rps_cd - (rps_cd_min * 60);
			}

			let rps_cd_text = '';
			if (rps_cd_min == 0 && rps_cd_sec == 0)
			{
				rps_cd_text = 'No cooldown! Go wild!';
			}
			else if (rps_cd_sec == 0)
			{
				rps_cd_text = `${rps_cd_min}m`;
			}
			else if (rps_cd_min == 0)
			{
				rps_cd_text = `${rps_cd_sec}s`;
			}
			else
			{
				rps_cd_text = `${rps_cd_min}m${rps_cd_sec}s`;
			}

			fields.push({ name: 'Rock, Paper, Scissors', value: '`/rps <amount> (optional opponent)>`\n' +
				'Win at rock paper scissors against your opponent to gain your bet\n' +
				'*gains: x1*\n' +
				`*cooldown: ${rps_cd_text}*` });

			// Guess The Number
			const guess_cd = await game_info.get(1).guess_cooldown;
			let guess_cd_min = 0;
			let guess_cd_sec = guess_cd;
			if (guess_cd >= 60)
			{
				guess_cd_min = Math.floor(guess_cd / 60);
				guess_cd_sec = guess_cd - (guess_cd_min * 60);
			}

			let guess_cd_text = '';
			if (guess_cd_min == 0 && guess_cd_sec == 0)
			{
				guess_cd_text = 'No cooldown! Go wild!';
			}
			else if (guess_cd_sec == 0)
			{
				guess_cd_text = `${guess_cd_min}m`;
			}
			else if (guess_cd_min == 0)
			{
				guess_cd_text = `${guess_cd_sec}s`;
			}
			else
			{
				guess_cd_text = `${guess_cd_min}m${guess_cd_sec}s`;
			}

			fields.push({ name: 'Guess The Number', value: '`/guess <amount>`\n' +
				'Guess the random number between **1** and **100**, in 5 attempts to gain your bet. The less attempts you use, the more you gain (**x10** in one shot).\n' +
				'*gains: from x0.5 to x10 depending on the attempts*\n' +
				`*cooldown: ${guess_cd_text}*` });

			// Roulette
			const roulette_cd = await game_info.get(1).roulette_cooldown;
			let roulette_cd_min = 0;
			let roulette_cd_sec = roulette_cd;
			if (roulette_cd >= 60)
			{
				roulette_cd_min = Math.floor(roulette_cd / 60);
				roulette_cd_sec = roulette_cd - (roulette_cd_min * 60);
			}

			let roulette_cd_text = '';
			if (roulette_cd_min == 0 && roulette_cd_sec == 0)
			{
				roulette_cd_text = 'No cooldown! Go wild!';
			}
			else if (roulette_cd_sec == 0)
			{
				roulette_cd_text = `${roulette_cd_min}m`;
			}
			else if (roulette_cd_min == 0)
			{
				roulette_cd_text = `${roulette_cd_sec}s`;
			}
			else
			{
				roulette_cd_text = `${roulette_cd_min}m${roulette_cd_sec}s`;
			}

			fields.push({ name: 'Roulette', value: '`/roulette <amount>`\n' +
				'Sruvive the roulette game to gain your bet. A 6 bullet revolver is used and the more you replay, the more you gain (x4 if you survive 5 shots). ' +
				'Answer `continue` to move to the next round and increase your gain... at your own risk.\n' +
				'*gains: from x1 to x4 depending on the round you reach*\n' +
				`*cooldown: ${roulette_cd_text}*` });

			// Add new games here

			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setDescription(gamble_text)
				.addFields(fields);
			await interaction.reply({ embeds: [embed] });
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