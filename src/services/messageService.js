const db = require('../db/database');

function saveMessage({ chat_id, contact_name, phone, direction, body, rule_id = null, rule_name = '' }) {
  db.prepare(`
    INSERT INTO messages (chat_id, contact_name, phone, direction, body, rule_id, rule_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    chat_id || '',
    contact_name || '',
    phone || '',
    direction || '',
    body || '',
    rule_id,
    rule_name || ''
  );
}

function getLastMessages(limit = 100) {
  return db.prepare(`
    SELECT * FROM messages
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  saveMessage,
  getLastMessages
};
