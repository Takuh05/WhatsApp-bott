const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Button } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // we use pairing code instead
    })

    // PAIRING CODE LOGIN
    if (!sock.authState.creds.registered) {
        const phoneNumber = '26377XXXXXXX' // <-- Put your number with country code. ZW = 263
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`Your Pairing Code: ${code}`) // Enter this on WhatsApp > Linked Devices
    }

    sock.ev.on('creds.update', saveCreds)

    // WHEN BOT GETS MESSAGE
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        // If user says "hi" or "menu"
        if (text.toLowerCase() === 'hi' || text.toLowerCase() === 'menu') {
            const buttons = [
                { buttonId: 'id1', buttonText: { displayText: '💰 Gold Price' }, type: 1 },
                { buttonId: 'id2', buttonText: { displayText: '📊 Deriv Signal' }, type: 1 },
                { buttonId: 'id3', buttonText: { displayText: '👤 Contact Admin' }, type: 1 }
            ]

            await sock.sendMessage(from, {
                text: "Hi! Welcome 👋 \nChoose an option below:",
                footer: "Sample Bot",
                buttons: buttons,
                headerType: 1
            })
        }

        // HANDLE BUTTON CLICKS
        if (msg.message.buttonsResponseMessage) {
            const buttonId = msg.message.buttonsResponseMessage.selectedButtonId
            
            if (buttonId === 'id1') {
                await sock.sendMessage(from, { text: 'Current Gold Price: $4412.90 per oz 📈' })
            }
            if (buttonId === 'id2') {
                await sock.sendMessage(from, { text: 'Today Signal: BUY Gold at 4410. SL: 4390 TP: 4450' })
            }
            if (buttonId === 'id3') {
                await sock.sendMessage(from, { text: 'Contact Admin: 0779 916 716' })
            }
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'open') console.log('✅ Bot Connected')
        if(connection === 'close') startBot() // reconnect
    })
}

startBot()
