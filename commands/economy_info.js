const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { game_info, users } = require('../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('economy_info')
		.setDescription('Get the info about this server\'s economy.'),
	async execute(interaction)
	{
		try
		{
			const currency_emoji = await game_info.get(1).emoji;
			const currency_name = await game_info.get(1).name;

			const daily_min = await game_info.get(1).daily_min;
			const daily_max = await game_info.get(1).daily_max;

			const work_min = await game_info.get(1).work_min;
			const work_max = await game_info.get(1).work_max;

			const max_bet = await game_info.get(1).max_bet;

			const gamble_field = (max_bet) ?
				{ name: ':slot_machine: Gamble', value: `You can gamble up to **${max_bet}** ${currency_emoji} for each game.` } :
				{ name: ':slot_machine: Gamble', value: 'There is no maximum bet, go crazy!' };

			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`${interaction.guild.name} Economy`)
				.addFields(
					{ name: ':dollar: Currency', value: `${currency_name} ${currency_emoji}` },
					{ name: ':moneybag: Daily Claim', value: `You can claim **once a day** using the command \`/daily\` and the reward can vary from **${daily_min}** ${currency_emoji} to **${daily_max}** ${currency_emoji}.
															Claim on consecutive days to earn a streak bonus (**x4** for **7 days** in a row).` },
					{ name: ':credit_card: Work', value: `You can claim a **paycheck once per hour** using the command \`/work\` and the value can vary from **${work_min}** ${currency_emoji} to **${work_max}** ${currency_emoji}.
														Claim your paycheck and start another shift by typing \`/work\` again.` },
					gamble_field,
				);
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