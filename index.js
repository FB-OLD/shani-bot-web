const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

let ownerNumber = '923060725589';
if (fs.existsSync('./owner.json')) {
    ownerNumber = JSON.parse(fs.readFileSync('./owner.json')).number;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Shani Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, pairingCode } = update;
        if (pairingCode) {
            console.log(`Pairing Code: ${pairingCode}`); // Vercel Logs میں یہی آئے گا
        }
        if (connection === 'open') {
            console.log('Bot Connected ✅');
            sock.sendMessage(ownerNumber + '@s.whatsapp.net', { text: 'Bot Online ho gaya 🔥' });
        }
    });

    sock.ev.on('creds.update', saveCreds);

    //.menu command + Emoji Reactions
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const from = msg.key.remoteJid;

        // Emoji Reaction
        await sock.sendMessage(from, { react: { text: '👀', key: msg.key } });

        if (text === '.menu') {
            await sock.sendMessage(from, {
                text: `*SHANI BOT MENU* 🤖\n\n1..menu\n2..pair\nOwner: ${ownerNumber}\nMade by Shani 💙`
            });
        }
    });
}

startBot();
