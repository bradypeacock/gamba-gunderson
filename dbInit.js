const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const GameInfo = require('./models/GameInfo.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () =>
{
	await GameInfo.findAndCountAll({}).then(async result =>
	{
		if (result.count == 0) await Promise.all([ GameInfo.create({}) ]);
		else await Promise.all([]);
	});

	console.log('Database synced');
	sequelize.close();
}).catch(console.error);