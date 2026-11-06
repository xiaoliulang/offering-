import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getAllData,
  savePrefixRules,
  savePartRules,
  saveRegions,
  saveWorkbench,
  saveRates,
  addHistoryRecords,
  deleteHistoryRecord,
  deleteHistoryBatch,
  clearAllHistory,
  resetDefaultConfigs,
} from './src/server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const EXPORT_DIR = path.resolve(process.cwd(), 'data');
const EXPORT_FILE_PATH = path.join(EXPORT_DIR, 'latest_workbench_export.xlsx');

async function startServer() {
  const app = express();

  // Initialize SQLite database and tables
  initDatabase();

  // CORS Middleware to allow Tampermonkey script on cbg.huawei.com to fetch export data
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // JSON Body Parser with ample limit for large offering batches
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Endpoints
  // Endpoint to save latest Excel export file (Base64 JSON)
  app.post('/api/workbench/latest-export', (req, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: 'Missing base64 data' });
      }
      const buffer = Buffer.from(base64, 'base64');
      if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
      }
      fs.writeFileSync(EXPORT_FILE_PATH, buffer);
      console.log(`[AutoFill] Saved latest export file (${buffer.length} bytes): ${filename || 'latest_workbench_export.xlsx'}`);
      res.json({ success: true, size: buffer.length, timestamp: Date.now() });
    } catch (err: any) {
      console.error('Failed to save latest export:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint for Tampermonkey or external scripts to download latest Excel export
  app.get('/api/workbench/latest-export.xlsx', (_req, res) => {
    try {
      if (fs.existsSync(EXPORT_FILE_PATH)) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="latest_workbench_export.xlsx"');
        res.sendFile(EXPORT_FILE_PATH);
      } else {
        res.status(404).json({ success: false, error: '暂无可用的最新导出表格，请先在工作台点击「自动化填充」' });
      }
    } catch (err: any) {
      console.error('Failed to serve latest export:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint to download the local Python Playwright bridge script
  const SCRIPT_FILE_PATH = path.join(path.resolve(process.cwd(), 'scripts'), 'cbg_bridge.py');
  app.get('/api/download-python-script', (_req, res) => {
    try {
      if (fs.existsSync(SCRIPT_FILE_PATH)) {
        res.setHeader('Content-Type', 'text/x-python; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="cbg_bridge.py"');
        res.sendFile(SCRIPT_FILE_PATH);
      } else {
        res.status(404).json({ success: false, error: '脚本文件不存在' });
      }
    } catch (err: any) {
      console.error('Failed to download python script:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint to download the Windows start_automation.bat launcher
  const BAT_FILE_PATH = path.join(path.resolve(process.cwd(), 'scripts'), 'start_automation.bat');
  app.get('/api/download-starter-bat', (_req, res) => {
    try {
      if (fs.existsSync(BAT_FILE_PATH)) {
        res.setHeader('Content-Type', 'application/x-bat');
        res.setHeader('Content-Disposition', 'attachment; filename="start_automation.bat"');
        res.sendFile(BAT_FILE_PATH);
      } else {
        res.status(404).json({ success: false, error: '启动脚本不存在' });
      }
    } catch (err: any) {
      console.error('Failed to download bat script:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/data', (_req, res) => {
    try {
      const data = getAllData();
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Failed to get data from sqlite:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/prefix-rules', (req, res) => {
    try {
      const { rules } = req.body;
      if (Array.isArray(rules)) {
        savePrefixRules(rules);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to save prefix rules:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/part-rules', (req, res) => {
    try {
      const { rules } = req.body;
      if (Array.isArray(rules)) {
        savePartRules(rules);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to save part rules:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/regions', (req, res) => {
    try {
      const { regions } = req.body;
      if (Array.isArray(regions)) {
        saveRegions(regions);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to save regions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/workbench', (req, res) => {
    try {
      const { rows } = req.body;
      if (Array.isArray(rows)) {
        saveWorkbench(rows);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to save workbench rows:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/rates', (req, res) => {
    try {
      const { rateMap } = req.body;
      if (rateMap && typeof rateMap === 'object') {
        saveRates(rateMap);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to save rates:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/history-records', (req, res) => {
    try {
      const { records } = req.body;
      if (Array.isArray(records)) {
        addHistoryRecords(records);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to add history records:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/history-records/:id', (req, res) => {
    try {
      const { id } = req.params;
      deleteHistoryRecord(id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete history record:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/history-records/batch/:batchId', (req, res) => {
    try {
      const { batchId } = req.params;
      deleteHistoryBatch(batchId);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to delete history batch:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/history-records/clear', (_req, res) => {
    try {
      clearAllHistory();
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to clear history:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/reset-default-configs', (_req, res) => {
    try {
      resetDefaultConfigs();
      res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to reset default configs:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Client Middleware: Dev vs Prod
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
