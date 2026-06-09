const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const paths = require('../config/paths');

fs.mkdirSync(path.dirname(paths.DB_FILE), { recursive: true });
fs.mkdirSync(paths.STORAGE, { recursive: true });

const db = new Database(paths.DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
