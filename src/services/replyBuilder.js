function buildSecretaryReply(cfg, contactName) {
  return `Hola${contactName ? ' ' + contactName : ''}, gracias por comunicarte con ${cfg.company_name}.

Soy ${cfg.secretary_name}.

Puedo ayudarte a derivarte correctamente.
Decime si necesitás:
- Ventas
- Soporte técnico`;
}

function buildSalesReply(cfg) {
  return `Hola, te habla ${cfg.sales_name} de ${cfg.company_name}.

${cfg.sales_personality}

Información útil:
${cfg.sales_knowledge}

Contame qué necesitás y te respondo con más precisión.`;
}

function buildSupportReply(cfg) {
  return `Hola, te habla ${cfg.support_name} de ${cfg.company_name}.

${cfg.support_personality}

Información útil:
${cfg.support_knowledge}

Describime el problema y te ayudo paso a paso.`;
}

function buildReplyFromType(type, cfg, context, customReply) {
  if (type === 'sales') return buildSalesReply(cfg);
  if (type === 'support') return buildSupportReply(cfg);
  if (type === 'secretary') return buildSecretaryReply(cfg, context.contactName);
  return String(customReply || '').trim();
}

module.exports = {
  buildSecretaryReply,
  buildSalesReply,
  buildSupportReply,
  buildReplyFromType
};
