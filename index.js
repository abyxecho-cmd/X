const fetch = require('node-fetch');
const http = require('http');

const TOKENS = process.env.TOKENS ? process.env.TOKENS.split(',') : [];
const CHANNEL_IDS = process.env.CHANNEL_IDS ? process.env.CHANNEL_IDS.split(',') : [];
const MESSAGE = process.env.MESSAGE;

let currentTokenIndex = 0;

if (!TOKENS.length || !CHANNEL_IDS.length || !MESSAGE) {
    console.error("Hata: Değişkenler eksik!");
    process.exit(1);
}

const sendTick = async () => {
    const token = TOKENS[currentTokenIndex].trim();
    // Rastgele bir kanal seçiyoruz (daha güvenli)
    const channelId = CHANNEL_IDS[Math.floor(Math.random() * CHANNEL_IDS.length)].trim();

    // Sıradaki hesaba geç
    currentTokenIndex = (currentTokenIndex + 1) % TOKENS.length;

    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
            },
            body: JSON.stringify({ content: MESSAGE })
        });

        if (response.ok) {
            console.log(`[+] Hesap ${currentTokenIndex + 1} gönderdi.`);
        } else {
            console.log(`[!] Hata/Limit: ${response.status}. Atlanıyor...`);
        }
    } catch (error) {
        console.log("Bağlantı hatası...");
    }

    // --- BURASI KRİTİK ---
    // 333ms ile 666ms arasında rastgele bir sayı seçer
    const randomDelay = Math.floor(Math.random() * (666 - 333 + 1)) + 333;
    
    // Bir sonraki atışı bu rastgele sürede yap
    setTimeout(sendTick, randomDelay);
};

// İlk tetiklemeyi başlat
sendTick();

http.createServer((req, res) => res.end("Dinamik Mod Aktif")).listen(process.env.PORT || 3000);
