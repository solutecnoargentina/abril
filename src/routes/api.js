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
      body { font-family: Arial, sans-serif; background:#111; color:#fff; text-align:center; padding:20px; }
      img { max-width: 360px; width:100%; background:#fff; padding:15px; border-radius:12px; }
      .box { max-width:420px; margin:0 auto; background:#1e1e1e; padding:20px; border-radius:16px; }
    </style>
  </head>
  <body>
    <div class="box">
      <h2>QR WhatsApp</h2>
      <p>Escaneá este QR desde el teléfono que va a usar el bot.</p>
      <img src="${qr}" alt="QR WhatsApp" />
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
  await whatsappService.restart();
  res.json({ ok: true, message: 'Reinicio solicitado' });
});

module.exports = router;
