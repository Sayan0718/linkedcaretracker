import { getCloudflareContext } from '@opennextjs/cloudflare';

class D1Wrapper {
  private db: any;
  constructor(db: any) {
    this.db = db;
  }
  
  async all(query: string, params: any[] = []) {
    let stmt = this.db.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    const res = await stmt.all();
    return res.results;
  }

  async get(query: string, params: any[] = []) {
    let stmt = this.db.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    return await stmt.first();
  }

  async run(query: string, params: any[] = []) {
    let stmt = this.db.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    const res = await stmt.run();
    return { lastID: res.meta?.last_row_id, changes: res.meta?.changes };
  }
  
  async exec(query: string) {
    const statements = query.split(';').map(s => s.trim()).filter(s => s.length > 0);
    const batch = statements.map(s => this.db.prepare(s));
    await this.db.batch(batch);
  }
}

export async function openDb() {
  try {
    const ctx = await getCloudflareContext() as any;
    if (ctx && ctx.env && ctx.env.DB) {
      return new D1Wrapper(ctx.env.DB);
    }
  } catch (e) {
    // Ignore error
  }
  
  // Local fallback using dynamic import so Webpack doesn't crash Edge build
  const sqlite3 = require('sqlite3');
  const sqlite = require('sqlite');
  const path = require('path');
  
  const db = await sqlite.open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      person TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subscribed_till TEXT,
      handled_by TEXT,
      software_linkage TEXT,
      backend_setup TEXT,
      frontend_setup TEXT,
      training TEXT,
      certificate_of_compliance TEXT,
      renewal_quotation_sent TEXT,
      renewal_quotation_sent_date TEXT,
      renewed TEXT,
      renewal_date TEXT,
      status TEXT,
      deboarded TEXT DEFAULT 'NO',
      deboard_reason TEXT,
      deboard_date TEXT
    );
    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    );
    CREATE TABLE IF NOT EXISTS renewal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      quote_date TEXT,
      payment_date TEXT,
      sub_till TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals (id)
    );
  `);
  
  return db;
}
