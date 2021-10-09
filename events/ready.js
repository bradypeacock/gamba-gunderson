const { Users, GameInfo, users, game_info } = require('../dbObjects.js');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client)
	{
		const storedUsers = await Users.findAll();
		storedUsers.forEach(b => users.set(b.user_id, b));

		const storedInfo = await GameInfo.findAll();
		storedInfo.forEach(b => game_info.set(1, b));
		console.log(game_info);

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};