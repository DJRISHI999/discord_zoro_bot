const fs = require('fs');

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
console.log('✅ Cookies converted and saved to cookies_parsed.txt');