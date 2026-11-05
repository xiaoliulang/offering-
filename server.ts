import express from 'express';
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

async function startServer() {
  const app = express();

  // Initialize SQLite database and tables
  initDatabase();

  // JSON Body Parser with ample limit for large offering batches
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Endpoints
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
