require('dotenv').config(); // Load environment variables from .env file

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For basic guild events
        GatewayIntentBits.GuildMessages, // For message events
        GatewayIntentBits.MessageContent, // For reading message content
        GatewayIntentBits.GuildVoiceStates, // Required for voice channel detection
    ]
});

const TOKEN = process.env.token; // Your Discord bot token
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Your YouTube API Key

// Initialize DisTube
const distube = new DisTube(client, {
    emitNewSongOnly: true, // Emit events only for new songs
    plugins: [
        require('@distube/yt-dlp'), // Use yt-dlp plugin
    ],
    apiKey: YOUTUBE_API_KEY, // Use YouTube API key
});

// Load commands dynamically
client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Event: Bot is ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Event: Message Create
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Handle DisTube commands
    if (commandName === 'play') {
        if (!message.member.voice.channel) {
            return message.reply('You need to be in a voice channel to play music!');
        }

        distube.play(message.member.voice.channel, args.join(' '), {
            textChannel: message.channel,
            member: message.member,
        });
        return;
    } else if (commandName === 'stop') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('There is no music playing!');
        queue.stop();
        message.channel.send('⏹ Stopped the music!');
        return;
    } else if (commandName === 'skip') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('There is no music playing!');
        queue.skip();
        message.channel.send('⏭ Skipped the current song!');
        return;
    }

    // Handle other commands
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

// DisTube Events
distube
    .on('playSong', (queue, song) =>
        queue.textChannel.send(`🎶 Playing: **${song.name}** - \`${song.formattedDuration}\``)
    )
    .on('addSong', (queue, song) =>
        queue.textChannel.send(`✅ Added: **${song.name}** - \`${song.formattedDuration}\``)
    )
    .on('error', (channel, error) => {
        console.error(error);
        channel.send('❌ An error occurred during playback.');
    });

client.login(TOKEN);

// Read the Netscape cookie file
const rawCookies = fs.readFileSync('./www.youtube.com_cookies.txt', 'utf8');

// Parse and convert cookies
const parsedCookies = rawCookies
    .split('\n') // Split by lines
    .filter(line => line && !line.startsWith('#')) // Remove comments and empty lines
    .map(line => {
        const parts = line.split('\t'); // Split by tabs
        return `${parts[5]}=${parts[6]}`; // Extract name and value
    })
    .join('; '); // Join cookies with semicolons

// Save the parsed cookies to a new file
fs.writeFileSync('./cookies_parsed.txt', parsedCookies);
console.log('Cookies converted and saved to cookies_parsed.txt');