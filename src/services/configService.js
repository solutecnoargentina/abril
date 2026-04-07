const db = require('../db/database');

function getConfig() {
  return db.prepare('SELECT * FROM app_config WHERE id = 1').get();
}

function updateConfig(data) {
  const current = getConfig();

  const next = {
    ...current,
    ...data,
    block_groups: data.block_groups !== undefined ? (data.block_groups ? 1 : 0) : current.block_groups,
    block_newsletters: data.block_newsletters !== undefined ? (data.block_newsletters ? 1 : 0) : current.block_newsletters,
    block_status: data.block_status !== undefined ? (data.block_status ? 1 : 0) : current.block_status,
    block_from_me: data.block_from_me !== undefined ? (data.block_from_me ? 1 : 0) : current.block_from_me,
    anti_old_messages: data.anti_old_messages !== undefined ? (data.anti_old_messages ? 1 : 0) : current.anti_old_messages,
    default_reply_enabled: data.default_reply_enabled !== undefined ? (data.default_reply_enabled ? 1 : 0) : current.default_reply_enabled
  };

  db.prepare(`
    UPDATE app_config SET
      company_name = @company_name,
      secretary_name = @secretary_name,
      secretary_personality = @secretary_personality,
      secretary_knowledge = @secretary_knowledge,
      sales_name = @sales_name,
      sales_personality = @sales_personality,
      sales_knowledge = @sales_knowledge,
      support_name = @support_name,
      support_personality = @support_personality,
      support_knowledge = @support_knowledge,
      block_groups = @block_groups,
      block_newsletters = @block_newsletters,
      block_status = @block_status,
      block_from_me = @block_from_me,
      anti_old_messages = @anti_old_messages,
      default_reply_enabled = @default_reply_enabled,
      fallback_agent = @fallback_agent,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(next);

  return getConfig();
}

module.exports = {
  getConfig,
  updateConfig
};
