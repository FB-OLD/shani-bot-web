const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

// 1. REACTIONS POOL - یہاں جتنے چاہو ایموجی ڈال دو۔ Bot Random اٹھائے گا
const REACTIONS = [
    '❤️', '😂', '😮', '😢', '😡', '👍', '👏', '🔥', '💯', '🤯',
    '🥵', '🙏', '😍', '🤝', '⚡', '💀', '🤡', '👌', '💪', '😎'
];

// 2. OWNER NUMBER - یہ Admin ہیں۔ صرف یہ!pair جیسی کمانڈ چلا سکیں گے
const OWNER = ['923001234567']; // اپنا نمبر ڈالو بغیر + کے

async function connectBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }), // Logs clean رکھنے کے لیے
        printQRCode: false,
        getMessage: async () => ({ conversation: 'dummy' }) // Anti-delete کے لیے ضروری
    });

    if (!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const code = await sock.requestPairingCode(OWNER[0]);
        console.log(`PAIRING CODE = ${code}`);
    }

    // 3. MAIN FUNCTION: AUTO REACT - 0.1 SEC DELAY
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return; // خود کے میسج پر React نہیں کرے گا

        const jid = msg.key.remoteJid;
        if (jid.endsWith('@g.us')) { // صرف Group میں React کرے گا
            try {
                const randomEmoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
                await sock.sendMessage(jid, {
                    react: {
                        text: randomEmoji,
                        key: msg.key
                    }
                });
                // console.log(`Reacted with ${randomEmoji} on ${jid}`);
            } catch (e) { console.log(e); }
        }
    });

    // 4. SIDE FEATURES: Anti Delete, Welcome, Group Info
    sock.ev.on('messages.update', async (updates) => {
        for (const { key, update } of updates) {
            if (update.message === null && key.remoteJid.endsWith('@g.us')) {
                sock.sendMessage(key.remoteJid, { text: `*Anti-Delete:* کسی نے میسج Delete کیا 👀` });
            }
        }
    });

    // 5. COMMANDS: صرف Owner کے لیے
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

        if (!OWNER.includes(sender.split('@')[0])) return; // Owner Check

        if (text.startsWith('!pair')) {
            const num = text.split(' ')[1];
            if (num) {
                const code = await sock.requestPairingCode(num);
                sock.sendMessage(from, { text: `Pairing Code: ${code}` });
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) connectBot();
        } else if (connection === 'open') {
            console.log('Bot Connected ✅ Auto-React ON');
        }
    });
}

connectBot();
