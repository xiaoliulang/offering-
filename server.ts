import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { chromium } from 'playwright';
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

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const EXPORT_DIR = path.resolve(process.cwd(), 'data');
const EXPORT_FILE_PATH = path.join(EXPORT_DIR, 'latest_workbench_export.xlsx');

async function executePlaywrightAutoFill(excelFilePath: string) {
  const targetUrl = 'https://cbg.huawei.com/#/group/finance/service_iprice_configuration';

  // 探测 Edge 浏览器执行路径
  let edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (!fs.existsSync(edgePath)) {
    edgePath = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
  }

  // 1. 检查是否在具备 Edge 的 Windows 环境下运行
  const isWindows = process.platform === 'win32';
  const hasEdge = fs.existsSync(edgePath) || fs.existsSync('C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe');

  if (!isWindows || !hasEdge) {
    console.log('[Playwright Engine] 检测到当前处于云端容器或非 Windows 环境，未找到本地 Edge。');
    return {
      isCloud: true,
      message:
        '已成功生成标准格式 Excel 文件并自动保存！\n\n' +
        '【提示】：当前页面运行在云端预览环境（Linux），无法直接穿透控制您办公电脑桌面的 Edge 浏览器。\n' +
        '当您在本地电脑运行本项目（npm run dev）时，点击此按钮将直接拉起您电脑上的 Edge 自动完成填报！',
    };
  }

  // 探测用户配置目录（支持自动获取当前用户目录或默认指定目录）
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\y00656362';
  let profileDir = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data');
  if (!fs.existsSync(profileDir)) {
    profileDir = 'C:\\Users\\y00656362\\AppData\\Local\\Microsoft\\Edge\\User Data';
  }

  console.log('[Playwright Engine] Edge 浏览器路径:', edgePath);
  console.log('[Playwright Engine] Edge 用户配置目录:', profileDir);
  console.log('[Playwright Engine] 目标 URL:', targetUrl);
  console.log('[Playwright Engine] 注入目标表格:', excelFilePath);

  // 2. 在 Windows 环境下清理残留 edge 进程，确保 9222 调试端口可绑定
  try {
    await execAsync('taskkill /f /im msedge.exe');
  } catch {
    // 忽略未运行时的报错
  }
  await new Promise((r) => setTimeout(r, 1500));

  // 3. 拉起带远程调试端口 9222 的 Edge 浏览器，继承用户的登录态
  console.log('[Playwright Engine] 正在拉起带 9222 调试端口的 Edge...');
  const edgeProc = spawn(
    edgePath,
    ['--remote-debugging-port=9222', `--user-data-dir=${profileDir}`, targetUrl],
    { detached: true, stdio: 'ignore' }
  );

  edgeProc.on('error', (procErr) => {
    console.warn('[Playwright Engine] Edge 进程启动异常 (已捕获):', procErr.message);
  });
  edgeProc.unref();

  console.log('[Playwright Engine] 等待 3.5 秒确保 Edge 调试服务就绪...');
  await new Promise((r) => setTimeout(r, 3500));

  // 3. Playwright 通过 CDP 连接本地 Edge 9222 端口
  console.log('[Playwright Engine] 正在连接本地 Edge 9222 调试端口...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0] || browser;

  let page = context.pages().find((p) => p.url().includes('service_iprice_configuration'));
  if (!page) {
    page = context.pages()[0] || (await context.newPage());
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  }

  // 步骤 1: 点击“服务Offering配置表” Tab
  console.log('[Playwright Engine] ⏳ 步骤 1/4: 定位并点击「服务Offering配置表」...');
  const tabElem = page.getByText('服务Offering配置表', { exact: true });
  await tabElem.waitFor({ state: 'visible', timeout: 15000 });
  await tabElem.click();
  console.log('[Playwright Engine] ✅ 步骤 1 完成：已切换至「服务Offering配置表」');

  // 步骤 2: 点击“导入”按钮
  console.log('[Playwright Engine] ⏳ 步骤 2/4: 点击「导入」按钮...');
  const importXPath =
    '//*[@id="serviceParameter"]/section/main/div/div/div/div[1]/div/div[6]/div[1]/div/div/div[1]/div[2]/div[4]/button';
  const importBtn = page.locator(`xpath=${importXPath}`);
  await importBtn.waitFor({ state: 'visible', timeout: 15000 });
  await importBtn.click();
  console.log('[Playwright Engine] ✅ 步骤 2 完成：已点击「导入」按钮');

  // 步骤 3: 点击弹框中的“选择文件”按钮
  console.log('[Playwright Engine] ⏳ 步骤 3/4: 点击上传弹窗中的「选择文件」按钮...');
  const uploadBtn = page.locator('button.uploadBtn');
  await uploadBtn.waitFor({ state: 'visible', timeout: 10000 });
  await uploadBtn.click();
  console.log('[Playwright Engine] ✅ 步骤 3 完成：已点击「选择文件」按钮');

  // 步骤 4: 静默注入 Excel 配置文件
  console.log(`[Playwright Engine] ⏳ 步骤 4/4: 注入 Excel 表格: ${excelFilePath}`);
  await page.setInputFiles("input[type='file']", excelFilePath);
  console.log('[Playwright Engine] ✅ 步骤 4 完成：Excel 文件注入成功！');

  console.log('[Playwright Engine] 🎉 步骤 1~4 已全部自动执行完成！步骤 5（保存）保持暂停供人工核对。');
  return true;
}

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

  // Endpoint to directly trigger Playwright auto-fill workflow
  app.post('/api/workbench/autofill', async (req, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64) {
        return res.status(400).json({ success: false, error: '缺少表格数据 (Missing base64)' });
      }
      const buffer = Buffer.from(base64, 'base64');
      if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
      }
      fs.writeFileSync(EXPORT_FILE_PATH, buffer);
      console.log(`[AutoFill API] 已生成待注入 Excel: ${EXPORT_FILE_PATH} (${buffer.length} 字节)`);

      // 在当前系统（本地机器）执行 Playwright 流程
      try {
        const result = await executePlaywrightAutoFill(EXPORT_FILE_PATH);
        if (result && typeof result === 'object' && (result as any).isCloud) {
          return res.json({
            success: false,
            isCloud: true,
            message: (result as any).message,
          });
        }
        res.json({
          success: true,
          message: '步骤 1~4 已全部自动执行完成！已在 Edge 中拉起并装填数据，请核对后手动点击【保存】。',
        });
      } catch (pwErr: any) {
        console.error('[Playwright Execution Error]:', pwErr);
        // 如果是在无 Edge 的云端容器运行，给出清晰友好的提示
        if (process.platform !== 'win32') {
          return res.json({
            success: false,
            isCloud: true,
            message:
              'Excel 表格已成功生成！当前工作台运行在云端 Linux 预览环境，无法直接拉起您办公电脑上的 Edge 浏览器。当您在本地电脑运行本项目（npm run dev）时，点击此按钮将全自动在您的电脑拉起 Edge 完成填报！',
          });
        }
        res.status(500).json({
          success: false,
          error: pwErr.message || '自动化执行异常',
        });
      }
    } catch (err: any) {
      console.error('[AutoFill Route Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
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
