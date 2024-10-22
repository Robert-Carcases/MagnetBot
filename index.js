import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import parseTorrent from 'parse-torrent';
import fs from "fs";

// Load environment variables from .env file
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// List of allowed user IDs (replace these with actual user IDs)
const allowedUserIds = process.env.USER_IDS.split(',');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Check if the user is allowed to use the command
    if (!allowedUserIds.includes(message.author.id)) {
        const reply = await message.reply('You do not have permission to use this command.');
        setTimeout(async () => {
            await message.delete();
            await reply.delete();
        }, 5000);
        return;
    }

    if (message.content.startsWith('!dwn')) {
        const urlMatch = message.content.match(/!dwn\s+(\S+)/);
        if (urlMatch) {
            const url = urlMatch[1];

            // Check if the URL is in the correct magnet format
            const isMagnetLink = url.startsWith('magnet:?xt=urn:btih:');

            if (!isMagnetLink) {
                const invalidReply = await message.reply('The provided link is not a valid magnet URL. Please provide a valid magnet URL.');
                setTimeout(async () => {
                    await invalidReply.delete();
                }, 5000);
                return; // Exit here since the URL is not valid
            }

            try {
                // Validate the magnet URL
                const parsedTorrent = parseTorrent(url);

                // If parseTorrent didn't throw an error, proceed
                const sentReply = await message.reply('The Magnet URL was sent to Qbittorrent.');
                const response = await axios.post('http://localhost:3000/api/download', { url });

                const successReply = await message.reply('The torrent was successfully downloaded.');
                setTimeout(async () => {
                    await sentReply.delete();
                    await successReply.delete();
                }, 5000);

                await message.delete();
            } catch (error) {
                console.error('Invalid magnet URL or other error:', error);
                const errorReply = await message.reply('The provided Magnet URL is invalid or malformed. Please check the link.');
                setTimeout(async () => {
                    await errorReply.delete();
                }, 5000);
            }
        } else {
            const invalidReply = await message.reply('Please provide a valid Magnet URL in the format: !dwn "magnet:?xt=urn:btih..."');
            setTimeout(async () => {
                await invalidReply.delete();
            }, 5000);
        }
    }

    if (message.content.startsWith('!test')) {
        try {
            const guild = message.guild;
            const members = await guild.members.fetch({ withPresences: true }); // Fetch only online members
            const onlineMembers = members.filter(member => !member.user.bot);
            
            if (onlineMembers.size === 0) {
                return message.channel.send('No online members to choose from.');
            }

            fs.readFile('insults.json', 'utf8', (err, data) => {
                if (err) {
                  console.error('Error reading the file:', err);
                  return;
                }
                const insults = JSON.parse(data).insults; // Parse the JSON data
                const randomIndex = Math.floor(Math.random() * insults.length);
                const randomInsult = insults[randomIndex].insult;
                const randomMember = onlineMembers.random(); // Randomly select a member
                message.channel.send(`<@${randomMember.user.id}> ${randomInsult}`);
            });
        } catch (error) {
        console.error('Error selecting a random user:', error);
        message.channel.send('Something went wrong!');            }
    }

    
});

// Log in to Discord using the bot token
client.login(process.env.DISCORD_TOKEN);
