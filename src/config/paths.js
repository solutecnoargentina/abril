const path = require('path');

const ROOT = process.env.SOLUTECNO_ROOT
  ? path.resolve(process.env.SOLUTECNO_ROOT)
  : path.resolve(process.cwd());
const STORAGE = path.join(ROOT, 'storage');

module.exports = {
  ROOT,
  SRC: path.join(ROOT, 'src'),
  PUBLIC: path.join(ROOT, 'public'),
  STORAGE,
  DB_FILE: path.join(STORAGE, 'db', 'bot.db'),
  SESSION_DIR: path.join(STORAGE, 'session'),
  LOG_DIR: path.join(STORAGE, 'logs')
};
