const Sequelize = require('sequelize');
const { Collection } = require('discord.js');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const GameInfo = require('./models/GameInfo.js')(sequelize, Sequelize.DataTypes);

const users = new Collection();

// ********** CURRENCY **********
Reflect.defineProperty(users, 'add', {
	/* eslint-disable-next-line func-name-matching */
	value: async function add(id, amount)
	{
		const user = users.get(id);
		if (user)
		{
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		users.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(users, 'getBalance', {
	/* eslint-disable-next-line func-name-matching */
	value: function getBalance(id)
	{
		const user = users.get(id);
		return user ? user.balance : 0;
	},
});

// ********** COOLDOWNS **********
Reflect.defineProperty(users, 'setCooldown', {
	/* eslint-disable-next-line func-name-matching */
	value: async function setCooldown(id, func, cooldown)
	{
		const user = users.get(id);

		if (user)
		{
			if (func == 'dice')
			{
				user.dice_cd = cooldown;
				return user.save();
			}
			else if (func == 'work')
			{
				user.work_cd = cooldown;
				return user.save();
			}
			else
			{
				console.log(`Something went wrong! setCooldown received an invalid value of ${func}`);
				return user;
			}
		}

		let newUser = '';
		if (func == 'dice')
		{
			newUser = await Users.create({ user_id: id, dice_cd: cooldown });
		}
		else if (func == 'work')
		{
			newUser = await Users.create({ user_id: id, work_cd: cooldown });
		}
		else
		{
			console.log(`Something went wrong! setCooldown received an invalid value of ${func}`);
			return newUser;
		}

		users.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(users, 'getCooldown', {
	/* eslint-disable-next-line func-name-matching */
	value: function getCooldown(id, func)
	{
		const user = users.get(id);

		if (user)
		{
			if (func == 'dice')
			{
				return user.dice_cd;
			}
			else if (func == 'work')
			{
				return user.work_cd;
			}
			else
			{
				console.log(`Something went wrong! getCooldown received an invalid value of ${func}`);
				return 0;
			}
		}
		else
		{
			return 0;
		}
	},
});

// ********** DAILIES AND WORK **********
Reflect.defineProperty(users, 'getDaily', {
	/* eslint-disable-next-line func-name-matching */
	value: async function getDaily(id)
	{
		const user = users.get(id);

		return user ? user.daily : 0;
	},
});

Reflect.defineProperty(users, 'setDaily', {
	/* eslint-disable-next-line func-name-matching */
	value: async function setDaily(id)
	{
		const user = users.get(id);
		const date = new Date();

		if (user)
		{
			user.daily = date;
			return user.save();
		}

		const newUser = await Users.create({ user_id: id, daily: date });
		users.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(users, 'getStreak', {
	/* eslint-disable-next-line func-name-matching */
	value: async function getStreak(id)
	{
		const user = users.get(id);

		return user ? user.streak : 1;
	},
});

Reflect.defineProperty(users, 'incStreak', {
	/* eslint-disable-next-line func-name-matching */
	value: async function incStreak(id)
	{
		const user = users.get(id);
		if (user)
		{
			user.streak += 1;
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, streak: 2 });
		users.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(users, 'resetStreak', {
	/* eslint-disable-next-line func-name-matching */
	value: async function resetStreak(id)
	{
		const user = users.get(id);
		if (user)
		{
			user.streak = 1;
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, streak: 1 });
		users.set(id, newUser);
		return newUser;
	},
});


Reflect.defineProperty(users, 'getPaycheck', {
	/* eslint-disable-next-line func-name-matching */
	value: async function getPaycheck(id)
	{
		const user = users.get(id);

		return user ? user.paycheck : 0;
	},
});

Reflect.defineProperty(users, 'setPaycheck', {
	/* eslint-disable-next-line func-name-matching */
	value: async function setPaycheck(id, paycheck)
	{
		const user = users.get(id);

		if (user)
		{
			user.paycheck = paycheck;
			return user.save();
		}

		const newUser = await Users.create({ user_id: id, paycheck: paycheck });
		users.set(id, newUser);
		return newUser;
	},
});

// ********** BOOLEANS **********
Reflect.defineProperty(users, 'getPlaying', {
	/* eslint-disable-next-line func-name-matching */
	value: async function getPlaying(id)
	{
		const user = users.get(id);

		return user ? user.playing : 0;
	},
});

Reflect.defineProperty(users, 'setPlaying', {
	/* eslint-disable-next-line func-name-matching */
	value: async function setPlaying(id, playing)
	{
		const user = users.get(id);

		if (user)
		{
			user.playing = playing;
			return user.save();
		}

		const newUser = await Users.create({ user_id: id, playing: playing });
		users.set(id, newUser);
		return newUser;
	},
});

// ********** GAME INFO **********
const game_info = new Collection();

module.exports = { Users, GameInfo, users, game_info };