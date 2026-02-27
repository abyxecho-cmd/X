const express = require('express');
const axios = require('axios');

// --- RENK KODLARI ---
const colorBlue = "\x1b[34m";
const colorRed = "\x1b[31m";
const colorYellow = "\x1b[33m";
const colorReset = "\x1b[0m";

// --- RENDER ENVIRONMENT AYARLARI ---
const TOKENS = process.env.TOKENS ? process.env.TOKENS.split(',').map(t => t.trim()) : [];
const CHANNEL_IDS = process.env.CHANNEL_IDS ? process.env.CHANNEL_IDS.split(',').map(c => c.trim()) : [];
const MESSAGE = process.env.MESSAGE || "Varsayılan Mesaj: Lütfen Render'dan MESSAGE değişkenini ayarlayın.";
const DELAY = 100; // 0 saniyeye en yakın (0.1 sn) güvenli gecikme

// --- KONTROL MEKANİZMASI ---
if (TOKENS.length === 0 || CHANNEL_IDS.length === 0) {
    console.log(`${colorRed}[HATA] TOKENS veya CHANNEL_IDS değişkenleri Render panelinde bulunamadı!${colorReset}`);
    process.exit(1);
}

// --- WEB SUNUCUSU (UptimeRobot İçin) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Sistem 7/24 Aktif!'));

app.listen(PORT, () => {
    console.log(`${colorYellow}--------------------------------------------------${colorReset}`);
    console.log(`${colorYellow}[SİSTEM] Sunucu Başlatıldı. Port: ${PORT}${colorReset}`);
    console.log(`${colorYellow}[SİSTEM] Aktif Token Sayısı: ${TOKENS.length}${colorReset}`);
    console.log(`${colorYellow}[SİSTEM] Aktif Kanal Sayısı: ${CHANNEL_IDS.length}${colorReset}`);
    console.log(`${colorYellow}--------------------------------------------------${colorReset}`);
    startMessaging();
});

// --- MESAJ GÖNDERME MOTORU ---
async function sendMessage(token, channelId) {
    try {
        await axios.post(
            `https://discord.com/api/v9/channels/${channelId}/messages`,
            { content: MESSAGE },
            { headers: { "Authorization": token, "Content-Type": "application/json" } }
        );

        // Mavi renkli başarı logu
        console.log(`${colorBlue}[MESAJ GİTTİ] KANAL: ${channelId} | TOKEN: ...${token.slice(-5)}${colorReset}`);
        return true;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 429) {
                const wait = error.response.data.retry_after * 1000;
                console.log(`${colorYellow}[HIZ SINIRI] Discord 'Dur' dedi. ${wait/1000}sn bekleniyor...${colorReset}`);
                await new Promise(r => setTimeout(r, wait));
                return await sendMessage(token, channelId);
            }
            console.log(`${colorRed}[HATA] Kod: ${error.response.status} - Mesaj: ${error.response.data.message}${colorReset}`);
        } else {
            console.log(`${colorRed}[BAĞLANTI HATASI] ${error.message}${colorReset}`);
        }
        return false;
    }
}

// --- ANA DÖNGÜ ---
async function startMessaging() {
    while (true) {
        for (const token of TOKENS) {
            for (const channelId of CHANNEL_IDS) {
                await sendMessage(token, channelId);
                // Render CPU'yu yormamak ve ban riskini azaltmak için milisaniyelik bekleme
                await new Promise(r => setTimeout(r, DELAY));
            }
        }
    }
}

// --- ANTI-CRASH (ASLA KAPANMAZ) ---
process.on('unhandledRejection', (reason) => console.log(`${colorRed}[KRİTİK] Hata: ${reason}${colorReset}`));
process.on('uncaughtException', (err) => console.log(`${colorRed}[KRİTİK] Hata: ${err.message}${colorReset}`));
