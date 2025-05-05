require('dotenv').config(); // Load environment variables from .env file

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp'); // Correctly import YtDlpPlugin
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas'); // Import canvas for dynamic images
const sharp = require('sharp'); // Import sharp for image conversion

// Read and parse the cookies before using them
const rawCookies = fs.readFileSync('./www.youtube.com_cookies.txt', 'utf8');
const parsedCookies = rawCookies
    .split('\n') // Split by lines
    .filter(line => line && !line.startsWith('#')) // Remove comments and empty lines
    .map(line => {
        const parts = line.split('\t'); // Split by tabs
        return `${parts[5]}=${parts[6]}`; // Extract name and value
    })
    .join('; '); // Join cookies with semicolons

// Discord client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For basic guild events
        GatewayIntentBits.GuildMessages, // For message events
        GatewayIntentBits.MessageContent, // For reading message content
        GatewayIntentBits.GuildVoiceStates, // Required for voice channel detection
    ]
});

const TOKEN = process.env.token; // Your Discord bot token

// Initialize DisTube with the YtDlpPlugin and parsed cookies
const distube = new DisTube(client, {
    emitNewSongOnly: true, // Emit events only for new songs
    plugins: [
        new YtDlpPlugin({ cookies: parsedCookies }) // Use parsed cookies
    ],
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

        const query = args.join(' ');
        if (!query) {
            return message.reply('Please provide a song name or URL!');
        }

        try {
            await distube.play(message.member.voice.channel, query, {
                textChannel: message.channel,
                member: message.member,
            });
        } catch (error) {
            if (error.errorCode === 'NO_RESULT') {
                return message.reply('❌ No results found for your query. Please provide a valid YouTube link or try a different search term.');
            }
            console.error('Error playing music:', error);
            message.reply('❌ An error occurred while trying to play the music.');
        }
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
        if (queue.songs.length <= 1) {
            queue.stop();
            return message.channel.send('⏭ Skipped the current song and stopped the music because there is no next song!');
        }
        queue.skip();
        message.channel.send('⏭ Skipped the current song!');
        return;
    } else if (commandName === 'pause') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('There is no music playing!');
        if (queue.paused) return message.reply('The music is already paused!');
        queue.pause();
        message.channel.send('⏸ Paused the music!');
        return;
    } else if (commandName === 'resume') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('There is no music playing!');
        if (!queue.paused) return message.reply('The music is already playing!');
        queue.resume();
        message.channel.send('▶ Resumed the music!');
        return;
    }

    // Handle other commands
    const command = client.commands.get(commandName);
    if (!command) return;

    // Check if the command is admin-only
    if (command.adminOnly && !message.member.permissions.has('Administrator')) {
        return message.reply('🚫 You do not have permission to use this command.');
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error in command ${commandName}:`, error);
        message.reply('❌ Something went wrong while running that command.');
    }
});

// Event: Voice State Update
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;

    // Check if the user started streaming
    if (!oldState.streaming && newState.streaming) {
        const user = newState.member.user;
        const channelName = newState.channel.name;

        // Find the announcements channel
        const announcementChannel = newState.guild.channels.cache.find(
            (channel) => channel.name === '📣・announcements' && channel.type === 0 // Ensure it's a text channel
        );

        if (!announcementChannel) {
            console.error('Announcements channel not found!');
            return;
        }

        // Fetch the user's avatar and convert it to PNG
        let avatarBuffer;
        try {
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 256 });
            const response = await fetch(avatarURL);
            const buffer = await response.arrayBuffer();
            avatarBuffer = await sharp(Buffer.from(buffer)).toFormat('png').toBuffer();
        } catch (error) {
            console.error('Error fetching or converting avatar:', error);
            return;
        }

        // Generate a dynamic image
        const canvas = createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add user avatar
        const avatar = await loadImage(avatarBuffer);
        ctx.drawImage(avatar, 25, 25, 200, 200);

        // Add text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Arial';
        ctx.fillText(`🎥 ${user.username} is streaming!`, 250, 100);
        ctx.fillText(`In channel: ${channelName}`, 250, 150);

        // Convert canvas to buffer
        const attachment = canvas.toBuffer();

        // Send the announcement with @everyone mention
        try {
            await announcementChannel.send({
                content: `@everyone 🎥 **${user.username}** is now streaming in **${channelName}**!`,
                files: [{ attachment, name: 'streaming-announcement.png' }],
            });
        } catch (error) {
            console.error('Error sending streaming announcement:', error);
        }
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