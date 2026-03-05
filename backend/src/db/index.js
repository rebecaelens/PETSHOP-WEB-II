const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const config = require('../config');

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;

  const dir = path.dirname(config.dbFile);
  fs.mkdirSync(dir, { recursive: true });

  dbPromise = open({
    filename: config.dbFile,
    driver: sqlite3.Database
  });

  const db = await dbPromise;
  await db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

module.exports = { getDb };
