const fs = require('fs');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const paths = require('../config/paths');
const { getConfig } = require('./configService');
const { saveMessage } = require('./messageService');
const { decideReply } = require('./ruleEngine');

function detectChromiumPath() {
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium'
  ];
  for (const item of candidates) {
    if (fs.existsSync(item)) return item;
  }
  return undefined;
}

class WhatsAppService {
  constructor() {
    this.client = null;
    this.currentQrText = null;
    this.currentQrDataUrl = null;
    this.isReady = false;
    this.clientInfo = null;
    this.bootUnix = Math.floor(Date.now() / 1000);
  }

  getState() {
    return {
      ready: this.isReady,
      state: this.clientInfo,
      qrAvailable: !!this.currentQrDataUrl
    };
  }

  getQrDataUrl() {
    return this.currentQrDataUrl;
  }

  isAllowedPrivateChat(chatIdServer) {
    return true;
  }

  async refreshQr(qr) {
    this.currentQrText = qr;
    this.currentQrDataUrl = await QRCode.toDataURL(qr);
  }

  buildClient() {
    const executablePath = detectChromiumPath();

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'solutecno-pro',
        dataPath: paths.SESSION_DIR
      }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      }
    });

    this.client.on('qr', async (qr) => {
      console.log('QR generado. Escanealo con WhatsApp.');
      qrcodeTerminal.generate(qr, { small: true });
      await this.refreshQr(qr);
      this.isReady = false;
      this.clientInfo = 'QR';
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp autenticado.');
    });

    this.client.on('ready', async () => {
      console.log('WhatsApp listo.');
      this.isReady = true;
      this.currentQrText = null;
      this.currentQrDataUrl = null;
      try {
        this.clientInfo = await this.client.getState();
      } catch {
        this.clientInfo = 'READY';
      }
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado:', reason);
      this.isReady = false;
      this.clientInfo = String(reason || 'DISCONNECTED');
    });

    this.client.on('message', async (msg) => {
      try {
        const cfg = getConfig();

        if (cfg.block_from_me && msg.fromMe) return;

        if (cfg.anti_old_messages) {
          const msgUnix = Number(msg.timestamp || 0);
          if (msgUnix && msgUnix < (this.bootUnix - 15)) return;
        }

        const chat = await msg.getChat();
        const contact = await msg.getContact();

        const server = chat?.id?.server || '';
        if (!this.isAllowedPrivateChat(server)) {
          if (cfg.block_groups && chat?.isGroup) return;
          if (cfg.block_newsletters && server === 'newsletter') return;
          if (cfg.block_status && server === 'status') return;
          return;
        }

        if (cfg.block_groups && chat?.isGroup) return;

        const body = String(msg.body || '').trim();
        const phone = String(contact?.number || '').trim();
        const contactName = contact?.pushname || contact?.name || '';
        const chatId = msg.from || '';

        saveMessage({
          chat_id: chatId,
          contact_name: contactName,
          phone,
          direction: 'in',
          body
        });

        if (!body) return;
        if (!cfg.default_reply_enabled) return;

        const context = {
          body,
          phone,
          contactName,
          chatId
        };

        const decision = decideReply(cfg, context);
        const reply = String(decision.reply || '').trim();

        if (!reply) return;

        await msg.reply(reply);

        saveMessage({
          chat_id: chatId,
          contact_name: contactName,
          phone,
          direction: 'out',
          body: reply,
          rule_id: decision.rule_id,
          rule_name: decision.rule_name || (decision.matched ? 'rule' : 'fallback')
        });

      } catch (err) {
        console.error('Error procesando mensaje:', err.message);
      }
    });
  }

  async initialize() {
    if (!this.client) {
      this.buildClient();
    }
    await this.client.initialize();
  }

  async restart() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
    } catch {}

    this.client = null;
    this.isReady = false;
    this.clientInfo = 'RESTARTING';
    this.currentQrText = null;
    this.currentQrDataUrl = null;

    setTimeout(() => {
      this.initialize().catch(err => {
        console.error('Error re-inicializando WhatsApp:', err.message);
      });
    }, 2000);
  }
}

module.exports = new WhatsAppService();
