const db = require('../db/database');
const { safeJsonParse } = require('./utils');

function listRules() {
  const rules = db.prepare(`
    SELECT *
    FROM rules
    ORDER BY priority ASC, id ASC
  `).all();

  const condStmt = db.prepare(`
    SELECT *
    FROM rule_conditions
    WHERE rule_id = ?
    ORDER BY sort_order ASC, id ASC
  `);

  return rules.map(rule => ({
    ...rule,
    conditions: condStmt.all(rule.id)
  }));
}

function getRuleById(id) {
  const rule = db.prepare(`SELECT * FROM rules WHERE id = ?`).get(id);
  if (!rule) return null;

  const conditions = db.prepare(`
    SELECT *
    FROM rule_conditions
    WHERE rule_id = ?
    ORDER BY sort_order ASC, id ASC
  `).all(id);

  return { ...rule, conditions };
}

function normalizeRulePayload(payload) {
  const conditionsRaw = Array.isArray(payload.conditions)
    ? payload.conditions
    : safeJsonParse(payload.conditions, []);

  const conditions = conditionsRaw
    .map((c, index) => ({
      field_name: String(c.field_name || 'body').trim(),
      operator: String(c.operator || 'contains').trim(),
      value: c.value == null ? '' : String(c.value),
      case_sensitive: c.case_sensitive ? 1 : 0,
      sort_order: Number(c.sort_order || index + 1)
    }))
    .filter(c => c.field_name && c.operator);

  return {
    name: String(payload.name || 'Regla sin nombre').trim(),
    description: String(payload.description || '').trim(),
    enabled: payload.enabled === undefined ? 1 : (payload.enabled ? 1 : 0),
    priority: Number(payload.priority || 100),
    logic_operator: String(payload.logic_operator || 'AND').trim().toUpperCase() === 'OR' ? 'OR' : 'AND',
    reply_type: String(payload.reply_type || 'custom').trim(),
    custom_reply: String(payload.custom_reply || '').trim(),
    stop_processing: payload.stop_processing === undefined ? 1 : (payload.stop_processing ? 1 : 0),
    conditions
  };
}

function createRule(payload) {
  const data = normalizeRulePayload(payload);

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO rules (
        name, description, enabled, priority, logic_operator, reply_type, custom_reply, stop_processing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.description,
      data.enabled,
      data.priority,
      data.logic_operator,
      data.reply_type,
      data.custom_reply,
      data.stop_processing
    );

    const ruleId = Number(info.lastInsertRowid);

    const insertCond = db.prepare(`
      INSERT INTO rule_conditions (
        rule_id, field_name, operator, value, case_sensitive, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const cond of data.conditions) {
      insertCond.run(
        ruleId,
        cond.field_name,
        cond.operator,
        cond.value,
        cond.case_sensitive,
        cond.sort_order
      );
    }

    return ruleId;
  });

  const ruleId = tx();
  return getRuleById(ruleId);
}

function updateRule(id, payload) {
  const data = normalizeRulePayload(payload);
  const exists = db.prepare(`SELECT id FROM rules WHERE id = ?`).get(id);
  if (!exists) return null;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE rules SET
        name = ?,
        description = ?,
        enabled = ?,
        priority = ?,
        logic_operator = ?,
        reply_type = ?,
        custom_reply = ?,
        stop_processing = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.description,
      data.enabled,
      data.priority,
      data.logic_operator,
      data.reply_type,
      data.custom_reply,
      data.stop_processing,
      id
    );

    db.prepare(`DELETE FROM rule_conditions WHERE rule_id = ?`).run(id);

    const insertCond = db.prepare(`
      INSERT INTO rule_conditions (
        rule_id, field_name, operator, value, case_sensitive, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const cond of data.conditions) {
      insertCond.run(
        id,
        cond.field_name,
        cond.operator,
        cond.value,
        cond.case_sensitive,
        cond.sort_order
      );
    }
  });

  tx();
  return getRuleById(id);
}

function deleteRule(id) {
  const exists = db.prepare(`SELECT id FROM rules WHERE id = ?`).get(id);
  if (!exists) return false;

  db.prepare(`DELETE FROM rules WHERE id = ?`).run(id);
  return true;
}

module.exports = {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
};
