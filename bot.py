import os

import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')
SERVER = os.getenv('SERVER_NAME')

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user.name} has connected to Discord!')

@bot.command(name='dice', help='Make a bet and roll the dice to try and beat your opponent')
async def dice(ctx, amount: int, opponent: str = None):
    if not amount:
        response = "Must provide an amount (integer)"
        await ctx.send(response)
        return

    if opponent:
        response = "Not implemented yet"
        await ctx.send(response)
        return
    
    response = "poopy"
    await ctx.send(response)

bot.run(BOT_TOKEN)