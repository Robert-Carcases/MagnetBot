import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// List of allowed user IDs (replace these with actual user IDs)
const allowedUserIds = process.env.USER_IDS.split(','); // Assuming USER_IDS is a comma-separated string

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignore the bot's own messages
    if (message.author.bot) return;

    // Check if the user is allowed to use the command
    if (!allowedUserIds.includes(message.author.id)) {
        // Send a permission denial reply
        const reply = await message.reply('You do not have permission to use this command.');
        // Delete the original message and the reply after a short delay
        setTimeout(async () => {
            try {
                await message.delete();
                await reply.delete(); // Optional: delete the reply as well
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }, 5000); // Adjust the delay time as needed (5000 ms = 5 seconds)
        return; // Exit the function after handling the permission check
    }

    // Check if the message starts with "!dwn" and contains a URL
    if (message.content.startsWith('!dwn')) {
        const urlMatch = message.content.match(/!dwn\s+(\S+)/);
        if (urlMatch) {
            const url = urlMatch[1]; // Extract the URL
    
            // Validate that it's a magnet link
            if (!url.startsWith("magnet:?")) {
                return message.reply('Please provide a valid Magnet URL.');
            }
    
            try {
                // Send the valid URL to your local API
                const sentReply = await message.reply(`The Magnet URL was sent to Qbittorrent.`);
                const response = await axios.post('http://localhost:3000/api/download', { url });
                
                // Success message
                const successReply = await message.reply(`The torrent was successfully downloaded.`);
                
                // Delete both the replies after 5 seconds
                setTimeout(async () => {
                    await sentReply.delete();
                    await successReply.delete();
                }, 5000);
    
                await message.delete(); // Delete the original message
            } catch (error) {
                console.error(error);
                message.reply('There was an error sending the Magnet URL to the local API.');
            }
        } else {
            message.reply('Please provide a valid Magnet URL in the format: !dwn "magnet-url"');
        }
    }
});

// Log in to Discord using the bot token
client.login(process.env.DISCORD_TOKEN);
