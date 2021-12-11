module.exports = (sequelize, DataTypes) =>
{
	return sequelize.define('game_info', {
		emoji: {
			type: DataTypes.STRING,
			defaultValue: ':coin:',
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			defaultValue: 'Coins',
		},
		max_bet: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		dice_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		rps_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		guess_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		roulette_cooldown: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		daily_min: {
			type: DataTypes.INTEGER,
			defaultValue: 200,
			allowNull: false,
		},
		daily_max: {
			type: DataTypes.INTEGER,
			defaultValue: 500,
			allowNull: false,
		},
		work_min: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
			allowNull: false,
		},
		work_max: {
			type: DataTypes.INTEGER,
			defaultValue: 300,
		},
	}, {
		timestamps: false,
	});
};