const path = require('path');

let Database;
let isNodeSqlite = false;

try {
  Database = require('better-sqlite3');
} catch {
  const { DatabaseSync } = require('node:sqlite');
  Database = DatabaseSync;
  isNodeSqlite = true;
}

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

if (isNodeSqlite) {
  try {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  } catch (e) {
    console.warn('Pragma set warning:', e.message);
  }

  db.pragma = function(sql) {
    try {
      return db.exec('PRAGMA ' + sql);
    } catch {
      return null;
    }
  };
} else {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

module.exports = db;
