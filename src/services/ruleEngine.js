const { listRules } = require('./ruleService');
const { buildReplyFromType } = require('./replyBuilder');

function getFieldValue(context, fieldName) {
  const map = {
    body: context.body || '',
    contact_name: context.contactName || '',
    phone: context.phone || '',
    chat_id: context.chatId || ''
  };
  return String(map[fieldName] || '');
}

function compareValue(left, operator, right, caseSensitive) {
  let a = String(left || '');
  let b = String(right || '');

  if (!caseSensitive) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }

  switch (operator) {
    case 'contains':
      return a.includes(b);
    case 'not_contains':
      return !a.includes(b);
    case 'equals':
      return a === b;
    case 'not_equals':
      return a !== b;
    case 'starts_with':
      return a.startsWith(b);
    case 'ends_with':
      return a.endsWith(b);
    case 'regex':
      try {
        const flags = caseSensitive ? '' : 'i';
        return new RegExp(String(right || ''), flags).test(String(left || ''));
      } catch {
        return false;
      }
    case 'is_empty':
      return String(left || '').trim() === '';
    case 'is_not_empty':
      return String(left || '').trim() !== '';
    default:
      return false;
  }
}

function evaluateCondition(condition, context) {
  const value = getFieldValue(context, condition.field_name);
  return compareValue(value, condition.operator, condition.value, !!condition.case_sensitive);
}

function evaluateRule(rule, context) {
  const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
  if (!conditions.length) return false;

  const results = conditions.map(c => evaluateCondition(c, context));
  if (rule.logic_operator === 'OR') return results.some(Boolean);
  return results.every(Boolean);
}

function resolveFallbackType(cfg) {
  const type = String(cfg.fallback_agent || 'secretary');
  if (['secretary', 'sales', 'support'].includes(type)) return type;
  return 'secretary';
}

function decideReply(cfg, context) {
  const rules = listRules().filter(r => Number(r.enabled) === 1);

  for (const rule of rules) {
    const matched = evaluateRule(rule, context);
    if (!matched) continue;

    const reply = buildReplyFromType(rule.reply_type, cfg, context, rule.custom_reply);
    if (!reply) continue;

    return {
      matched: true,
      rule_id: rule.id,
      rule_name: rule.name,
      reply,
      stop_processing: !!rule.stop_processing
    };
  }

  const fallbackType = resolveFallbackType(cfg);
  const fallbackReply = buildReplyFromType(fallbackType, cfg, context, '');

  return {
    matched: false,
    rule_id: null,
    rule_name: '',
    reply: fallbackReply,
    stop_processing: true
  };
}

module.exports = {
  decideReply
};
