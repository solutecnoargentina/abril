const Database = require('better-sqlite3');
const paths = require('../config/paths');

const db = new Database(paths.DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
