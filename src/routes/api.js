const express = require('express');
const { getConfig, updateConfig } = require('../services/configService');
const { getLastMessages } = require('../services/messageService');
const { listRules, createRule, updateRule, deleteRule } = require('../services/ruleService');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

router.get('/status', (req, res) => {
  const state = whatsappService.getState();
  res.json({
    ok: true,
    ...state
  });
});

router.get('/qr', (req, res) => {
  const qr = whatsappService.getQrDataUrl();

  if (!qr) {
    return res.status(404).send('QR no disponible todavía. Esperá unos segundos y volvé a abrir.');
  }

  const html = `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>QR WhatsApp - Solutecno Argentina</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: Inter, Arial, sans-serif; background: linear-gradient(180deg,#f5f9ff,#ffffff); color:#071629; text-align:center; padding:24px; }
      .box { max-width:460px; margin:0 auto; background:#fff; padding:24px; border-radius:24px; border:1px solid #dce8fa; box-shadow:0 18px 50px rgba(7,22,41,.10); }
      img { max-width: 100%; width: 100%; background:#fff; padding:14px; border-radius:16px; border:1px solid #dce8fa; }
      h2 { margin:0 0 10px; font-size:28px; }
      p { color:#637083; line-height:1.6; }
      a { display:inline-block; margin-top:16px; text-decoration:none; background:#0B63FF; color:#fff; padding:12px 18px; border-radius:999px; font-weight:800; }
    </style>
  </head>
  <body>
    <div class="box">
      <h2>QR de WhatsApp</h2>
      <p>Escaneá este código desde el teléfono que va a usar el bot.</p>
      <img src="${qr}" alt="QR WhatsApp" />
      <a href="/api/status">Volver al panel</a>
    </div>
  </body>
  </html>`;
  res.send(html);
});

router.get('/config', (req, res) => {
  res.json({ ok: true, config: getConfig() });
});

router.post('/config', (req, res) => {
  const saved = updateConfig(req.body || {});
  res.json({ ok: true, config: saved });
});

router.get('/messages', (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
  res.json({ ok: true, messages: getLastMessages(limit) });
});

router.get('/rules', (req, res) => {
  res.json({ ok: true, rules: listRules() });
});

router.post('/rules', (req, res) => {
  const rule = createRule(req.body || {});
  res.json({ ok: true, rule });
});

router.put('/rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const rule = updateRule(id, req.body || {});
  if (!rule) return res.status(404).json({ ok: false, error: 'Regla no encontrada' });
  res.json({ ok: true, rule });
});

router.delete('/rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const deleted = deleteRule(id);
  if (!deleted) return res.status(404).json({ ok: false, error: 'Regla no encontrada' });
  res.json({ ok: true });
});

router.post('/restart-whatsapp', async (req, res) => {
  await whatsappService.restart({ resetSession: !!req.body?.resetSession });
  res.json({ ok: true, message: 'Reinicio solicitado' });
});

router.post('/reset-session', async (req, res) => {
  await whatsappService.resetSession();
  res.json({ ok: true, message: 'Sesión limpia y reinicio solicitado' });
});

module.exports = router;
