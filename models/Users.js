module.exports = (sequelize, DataTypes) =>
{
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		daily: {
			type: DataTypes.DATE,
			defaultValue: 0,
			allowNull: false,
		},
		streak: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
		dice_cd: {
			type: DataTypes.FLOAT,
			defaultValue: 0,
			allowNull: false,
		},
		work_cd: {
			type: DataTypes.FLOAT,
			defaultValue: 0,
			allowNull: false,
		},
		paycheck: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		// Use this as a boolean. Only set value to 0 or 1
		playing: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};