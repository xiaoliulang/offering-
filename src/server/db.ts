import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  PrefixRule,
  PartRule,
  RegionItem,
  OfferingRow,
  HistoryRiskRecord,
} from '../types/offering';
import {
  DEFAULT_PREFIX_RULES,
  DEFAULT_PART_RULES,
  DEFAULT_REGIONS,
  DEFAULT_OFFERING_ROWS,
} from '../utils/offeringParser';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'offering.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prefix_rules (
      id TEXT PRIMARY KEY,
      prefix TEXT NOT NULL,
      lv3 TEXT NOT NULL,
      lv4 TEXT NOT NULL,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS part_rules (
      id TEXT PRIMARY KEY,
      lv4 TEXT NOT NULL,
      bu TEXT NOT NULL,
      parts TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS workbench_offerings (
      id TEXT PRIMARY KEY,
      region TEXT,
      lv3 TEXT,
      lv4 TEXT,
      offering TEXT,
      hardwareBU TEXT,
      hardwareLV3 TEXT,
      hardwareOffering TEXT,
      priceFrom TEXT,
      priceTo TEXT,
      term TEXT,
      count TEXT,
      target TEXT,
      parts TEXT,
      status TEXT,
      validationMsg TEXT,
      sort_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS history_risk_records (
      id TEXT PRIMARY KEY,
      batchId TEXT NOT NULL,
      savedAt TEXT NOT NULL,
      region TEXT,
      lv3 TEXT,
      lv4 TEXT,
      hardwareBU TEXT,
      hardwareLV3 TEXT,
      hardwareOffering TEXT,
      target TEXT,
      term TEXT,
      count TEXT,
      part TEXT,
      riskRate TEXT
    );

    CREATE TABLE IF NOT EXISTS rates_cache (
      rate_key TEXT PRIMARY KEY,
      rate_value TEXT NOT NULL
    );
  `);

  // Seed default data if tables are empty
  const prefixCount = (db.prepare('SELECT COUNT(*) as count FROM prefix_rules').get() as { count: number }).count;
  if (prefixCount === 0) {
    const insertPrefix = db.prepare('INSERT INTO prefix_rules (id, prefix, lv3, lv4, remark) VALUES (?, ?, ?, ?, ?)');
    const seedPrefixTx = db.transaction((rules: PrefixRule[]) => {
      for (const r of rules) {
        insertPrefix.run(r.id, r.prefix, r.lv3, r.lv4, r.remark || '');
      }
    });
    seedPrefixTx(DEFAULT_PREFIX_RULES);
  }

  const partCount = (db.prepare('SELECT COUNT(*) as count FROM part_rules').get() as { count: number }).count;
  if (partCount === 0) {
    const insertPart = db.prepare('INSERT INTO part_rules (id, lv4, bu, parts) VALUES (?, ?, ?, ?)');
    const seedPartTx = db.transaction((rules: PartRule[]) => {
      for (const r of rules) {
        insertPart.run(r.id, r.lv4, r.bu, r.parts);
      }
    });
    seedPartTx(DEFAULT_PART_RULES);
  }

  const regionCount = (db.prepare('SELECT COUNT(*) as count FROM regions').get() as { count: number }).count;
  if (regionCount === 0) {
    const insertRegion = db.prepare('INSERT INTO regions (id, name, remark) VALUES (?, ?, ?)');
    const seedRegionTx = db.transaction((regs: RegionItem[]) => {
      for (const r of regs) {
        insertRegion.run(r.id, r.name, r.remark || '');
      }
    });
    seedRegionTx(DEFAULT_REGIONS);
  }

  const workbenchCount = (db.prepare('SELECT COUNT(*) as count FROM workbench_offerings').get() as { count: number }).count;
  if (workbenchCount === 0) {
    const insertRow = db.prepare(`
      INSERT INTO workbench_offerings (
        id, region, lv3, lv4, offering, hardwareBU, hardwareLV3, hardwareOffering,
        priceFrom, priceTo, term, count, target, parts, status, validationMsg, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedRowTx = db.transaction((rows: OfferingRow[]) => {
      rows.forEach((r, idx) => {
        insertRow.run(
          r.id,
          r.region || '',
          r.lv3 || '',
          r.lv4 || '',
          r.offering || '',
          r.hardwareBU || '',
          r.hardwareLV3 || '',
          r.hardwareOffering || '',
          r.priceFrom || '',
          r.priceTo || '',
          r.term || '',
          r.count || '',
          r.target || '',
          r.parts || '',
          r.status || 'valid',
          r.validationMsg || '',
          idx
        );
      });
    });
    seedRowTx(DEFAULT_OFFERING_ROWS);
  }
}

// Queries
export function getAllData() {
  const prefixRules = db.prepare('SELECT id, prefix, lv3, lv4, remark FROM prefix_rules').all() as PrefixRule[];
  const partRules = db.prepare('SELECT id, lv4, bu, parts FROM part_rules').all() as PartRule[];
  const regionTable = db.prepare('SELECT id, name, remark FROM regions').all() as RegionItem[];
  const tableData = db.prepare(`
    SELECT id, region, lv3, lv4, offering, hardwareBU, hardwareLV3, hardwareOffering,
           priceFrom, priceTo, term, count, target, parts, status, validationMsg
    FROM workbench_offerings
    ORDER BY sort_order ASC
  `).all() as OfferingRow[];

  const historyRecords = db.prepare(`
    SELECT id, batchId, savedAt, region, lv3, lv4, hardwareBU, hardwareLV3,
           hardwareOffering, target, term, count, part, riskRate
    FROM history_risk_records
    ORDER BY rowid DESC
  `).all() as HistoryRiskRecord[];

  const rawRates = db.prepare('SELECT rate_key, rate_value FROM rates_cache').all() as { rate_key: string; rate_value: string }[];
  const ratesObj: Record<string, string> = {};
  rawRates.forEach((r) => {
    ratesObj[r.rate_key] = r.rate_value;
  });

  return {
    prefixRules,
    partRules,
    regionTable,
    tableData,
    ratesObj,
    historyRecords,
  };
}

export function savePrefixRules(rules: PrefixRule[]) {
  const deleteStmt = db.prepare('DELETE FROM prefix_rules');
  const insertStmt = db.prepare('INSERT INTO prefix_rules (id, prefix, lv3, lv4, remark) VALUES (?, ?, ?, ?, ?)');
  const tx = db.transaction(() => {
    deleteStmt.run();
    for (const r of rules) {
      insertStmt.run(r.id, r.prefix, r.lv3, r.lv4, r.remark || '');
    }
  });
  tx();
}

export function savePartRules(rules: PartRule[]) {
  const deleteStmt = db.prepare('DELETE FROM part_rules');
  const insertStmt = db.prepare('INSERT INTO part_rules (id, lv4, bu, parts) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    deleteStmt.run();
    for (const r of rules) {
      insertStmt.run(r.id, r.lv4, r.bu, r.parts);
    }
  });
  tx();
}

export function saveRegions(regs: RegionItem[]) {
  const deleteStmt = db.prepare('DELETE FROM regions');
  const insertStmt = db.prepare('INSERT INTO regions (id, name, remark) VALUES (?, ?, ?)');
  const tx = db.transaction(() => {
    deleteStmt.run();
    for (const r of regs) {
      insertStmt.run(r.id, r.name, r.remark || '');
    }
  });
  tx();
}

export function saveWorkbench(rows: OfferingRow[]) {
  const deleteStmt = db.prepare('DELETE FROM workbench_offerings');
  const insertStmt = db.prepare(`
    INSERT INTO workbench_offerings (
      id, region, lv3, lv4, offering, hardwareBU, hardwareLV3, hardwareOffering,
      priceFrom, priceTo, term, count, target, parts, status, validationMsg, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    deleteStmt.run();
    rows.forEach((r, idx) => {
      insertStmt.run(
        r.id,
        r.region || '',
        r.lv3 || '',
        r.lv4 || '',
        r.offering || '',
        r.hardwareBU || '',
        r.hardwareLV3 || '',
        r.hardwareOffering || '',
        r.priceFrom || '',
        r.priceTo || '',
        r.term || '',
        r.count || '',
        r.target || '',
        r.parts || '',
        r.status || 'valid',
        r.validationMsg || '',
        idx
      );
    });
  });
  tx();
}

export function saveRates(rateMap: Record<string, string>) {
  const insertStmt = db.prepare('INSERT OR REPLACE INTO rates_cache (rate_key, rate_value) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(rateMap)) {
      insertStmt.run(key, val);
    }
  });
  tx();
}

export function addHistoryRecords(records: HistoryRiskRecord[]) {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO history_risk_records (
      id, batchId, savedAt, region, lv3, lv4, hardwareBU, hardwareLV3,
      hardwareOffering, target, term, count, part, riskRate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const r of records) {
      insertStmt.run(
        r.id,
        r.batchId,
        r.savedAt,
        r.region || '',
        r.lv3 || '',
        r.lv4 || '',
        r.hardwareBU || '',
        r.hardwareLV3 || '',
        r.hardwareOffering || '',
        r.target || '',
        r.term || '',
        r.count || '',
        r.part || '',
        r.riskRate || ''
      );
    }
  });
  tx();
}

export function deleteHistoryRecord(id: string) {
  db.prepare('DELETE FROM history_risk_records WHERE id = ?').run(id);
}

export function deleteHistoryBatch(batchId: string) {
  db.prepare('DELETE FROM history_risk_records WHERE batchId = ?').run(batchId);
}

export function clearAllHistory() {
  db.prepare('DELETE FROM history_risk_records').run();
}

export function resetDefaultConfigs() {
  savePrefixRules(DEFAULT_PREFIX_RULES);
  savePartRules(DEFAULT_PART_RULES);
  saveRegions(DEFAULT_REGIONS);
}
