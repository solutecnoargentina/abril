const fs = require('fs');
const db = require('./database');
const paths = require('../config/paths');

function initDatabase() {
  fs.mkdirSync(paths.STORAGE, { recursive: true });
  fs.mkdirSync(paths.LOG_DIR, { recursive: true });
  fs.mkdirSync(paths.SESSION_DIR, { recursive: true });

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'Solutecno Argentina',
      secretary_name TEXT NOT NULL DEFAULT 'Secretaria',
      secretary_personality TEXT NOT NULL DEFAULT 'Sos una secretaria cordial, breve y profesional.',
      secretary_knowledge TEXT NOT NULL DEFAULT 'Tu función es recibir, ordenar y derivar.',
      sales_name TEXT NOT NULL DEFAULT 'Ventas',
      sales_personality TEXT NOT NULL DEFAULT 'Sos un agente de ventas claro, amable y persuasivo.',
      sales_knowledge TEXT NOT NULL DEFAULT 'Ofrecemos soluciones tecnológicas, bots, automatización y soporte.',
      support_name TEXT NOT NULL DEFAULT 'Soporte',
      support_personality TEXT NOT NULL DEFAULT 'Sos soporte técnico paciente, claro y resolutivo.',
      support_knowledge TEXT NOT NULL DEFAULT 'Ayudás con problemas técnicos, configuración y seguimiento.',
      block_groups INTEGER NOT NULL DEFAULT 1,
      block_newsletters INTEGER NOT NULL DEFAULT 1,
      block_status INTEGER NOT NULL DEFAULT 1,
      block_from_me INTEGER NOT NULL DEFAULT 1,
      anti_old_messages INTEGER NOT NULL DEFAULT 1,
      default_reply_enabled INTEGER NOT NULL DEFAULT 1,
      fallback_agent TEXT NOT NULL DEFAULT 'secretary',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 100,
      logic_operator TEXT NOT NULL DEFAULT 'AND',
      reply_type TEXT NOT NULL DEFAULT 'custom',
      custom_reply TEXT DEFAULT '',
      stop_processing INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rule_conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      field_name TEXT NOT NULL DEFAULT 'body',
      operator TEXT NOT NULL DEFAULT 'contains',
      value TEXT DEFAULT '',
      case_sensitive INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(rule_id) REFERENCES rules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT DEFAULT '',
      contact_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      direction TEXT DEFAULT '',
      body TEXT DEFAULT '',
      rule_id INTEGER,
      rule_name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const exists = db.prepare('SELECT id FROM app_config WHERE id = 1').get();
  if (!exists) {
    db.prepare(`
      INSERT INTO app_config (
        id,
        company_name,
        secretary_name, secretary_personality, secretary_knowledge,
        sales_name, sales_personality, sales_knowledge,
        support_name, support_personality, support_knowledge,
        block_groups, block_newsletters, block_status, block_from_me,
        anti_old_messages, default_reply_enabled, fallback_agent
      ) VALUES (
        1,
        'Solutecno Argentina',
        'Secretaria', 'Sos una secretaria cordial, breve y profesional.', 'Tu función es recibir, ordenar y derivar.',
        'Ventas', 'Sos un agente de ventas claro, amable y persuasivo.', 'Ofrecemos soluciones tecnológicas, bots, automatización y soporte.',
        'Soporte', 'Sos soporte técnico paciente, claro y resolutivo.', 'Ayudás con problemas técnicos, configuración y seguimiento.',
        1, 1, 1, 1, 1, 1, 'secretary'
      )
    `).run();
  }

  const ruleCount = db.prepare('SELECT COUNT(*) AS total FROM rules').get().total;
  if (ruleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO rules (
        name, description, enabled, priority, logic_operator, reply_type, custom_reply, stop_processing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCondition = db.prepare(`
      INSERT INTO rule_conditions (
        rule_id, field_name, operator, value, case_sensitive, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const sales = insertRule.run(
      'Ventas por palabras clave',
      'Deriva a ventas cuando detecta intención comercial.',
      1,
      10,
      'OR',
      'sales',
      '',
      1
    );
    insertCondition.run(sales.lastInsertRowid, 'body', 'contains', 'precio', 0, 1);
    insertCondition.run(sales.lastInsertRowid, 'body', 'contains', 'presupuesto', 0, 2);
    insertCondition.run(sales.lastInsertRowid, 'body', 'contains', 'comprar', 0, 3);
    insertCondition.run(sales.lastInsertRowid, 'body', 'contains', 'costo', 0, 4);

    const support = insertRule.run(
      'Soporte por palabras clave',
      'Deriva a soporte cuando detecta problemas técnicos.',
      1,
      20,
      'OR',
      'support',
      '',
      1
    );
    insertCondition.run(support.lastInsertRowid, 'body', 'contains', 'error', 0, 1);
    insertCondition.run(support.lastInsertRowid, 'body', 'contains', 'falla', 0, 2);
    insertCondition.run(support.lastInsertRowid, 'body', 'contains', 'problema', 0, 3);
    insertCondition.run(support.lastInsertRowid, 'body', 'contains', 'soporte', 0, 4);

    const hola = insertRule.run(
      'Saludo básico',
      'Responde a saludos comunes.',
      1,
      30,
      'OR',
      'custom',
      'Hola, gracias por comunicarte con Solutecno Argentina. Contame si necesitás ventas o soporte técnico.',
      1
    );
    insertCondition.run(hola.lastInsertRowid, 'body', 'equals', 'hola', 0, 1);
    insertCondition.run(hola.lastInsertRowid, 'body', 'equals', 'buenas', 0, 2);
    insertCondition.run(hola.lastInsertRowid, 'body', 'equals', 'buen día', 0, 3);
  }
}

module.exports = { initDatabase };
