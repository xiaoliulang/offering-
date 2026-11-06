import { DecodedOffering, OfferingRow, PartRule, PrefixRule, RegionItem, RiskTableRow } from '../types/offering';
import ExcelJS from 'exceljs';

export const DEFAULT_PREFIX_RULES: PrefixRule[] = [
  { id: 'pref-1', prefix: 'ASDW', lv3: '保险服务', lv4: '华为碎屏服务宝', remark: '标准碎屏保' },
  { id: 'pref-2', prefix: 'CAP', lv3: '保险服务', lv4: '华为碎屏服务宝', remark: '政企业务碎屏保' },
  { id: 'pref-3', prefix: 'BCAI', lv3: '保险服务', lv4: '华为全保服务宝', remark: '包含主板/屏幕/外壳综合保障' },
  { id: 'pref-4', prefix: 'WDP', lv3: '保险服务', lv4: '华为延长保修', remark: '官方主板及主机部件质保延长' },
  { id: 'pref-5', prefix: 'ACAP', lv3: '保险服务', lv4: '华为意外服务宝', remark: '进水/摔落/碎屏综合意外险' },
  { id: 'pref-6', prefix: 'BAT', lv3: '保险服务', lv4: '华为电池安心换', remark: '官方原装电池一口价更换服务' },
];

export const DEFAULT_PART_RULES: PartRule[] = [
  { id: 'part-1', lv4: '华为碎屏服务宝', bu: 'Hope', parts: '前壳,外屏' },
  { id: 'part-2', lv4: '华为碎屏服务宝', bu: 'Mate', parts: '前壳,外屏,中框组件' },
  { id: 'part-3', lv4: '华为碎屏服务宝', bu: 'P-Series', parts: '前壳,外屏,胶水耗材' },
  { id: 'part-4', lv4: '华为碎屏服务宝', bu: 'Nova', parts: '前壳,外屏' },
  { id: 'part-5', lv4: '华为全保服务宝', bu: 'Hope', parts: '屏幕组件,主板,键盘C壳,原装电池,电源适配器' },
  { id: 'part-6', lv4: '华为全保服务宝', bu: 'Mate', parts: '主屏幕,后盖玻璃,主板,后置摄像头,电池' },
  { id: 'part-7', lv4: '华为延长保修', bu: 'Hope', parts: '主机整机,主板主电路,散热模组' },
  { id: 'part-8', lv4: '华为延长保修', bu: 'Mate', parts: '主机整机,主板模组,指纹识别' },
  { id: 'part-9', lv4: '华为意外服务宝', bu: 'Mate', parts: '屏幕模组,后盖总成,主板元器件,后置摄像头' },
  { id: 'part-10', lv4: '华为电池安心换', bu: 'Hope', parts: '高容量原装锂电池' },
  { id: 'part-11', lv4: '华为电池安心换', bu: 'Mate', parts: '原装快充锂电池' },
];

export const DEFAULT_REGIONS: RegionItem[] = [
  { id: 'reg-1', name: '华东大区', remark: '上海、江苏、浙江、安徽、山东等核心销区' },
  { id: 'reg-2', name: '华北大区', remark: '北京、天津、河北、山西、内蒙古' },
  { id: 'reg-3', name: '华南大区', remark: '广东、广西、海南、福建' },
  { id: 'reg-4', name: '华中大区', remark: '湖北、湖南、河南、江西' },
  { id: 'reg-5', name: '西南大区', remark: '四川、重庆、云南、贵州、西藏' },
  { id: 'reg-6', name: '西北大区', remark: '陕西、甘肃、青海、宁夏、新疆' },
  { id: 'reg-7', name: '东北大区', remark: '辽宁、吉林、黑龙江' },
  { id: 'reg-8', name: '全国通用', remark: '全渠道线上电商及直营通用' },
];

export const DEFAULT_OFFERING_ROWS: OfferingRow[] = [
  {
    id: 'row-1',
    region: '华东大区',
    lv3: '保险服务',
    lv4: '华为碎屏服务宝',
    offering: 'ASDW-Hope-1AY121CAB',
    hardwareBU: 'Hope',
    hardwareLV3: '笔记本',
    hardwareOffering: 'HW-OFF-01',
    priceFrom: '0',
    priceTo: '5000',
    term: '12',
    count: '1',
    target: 'C',
    parts: '前壳,外屏',
    status: 'valid'
  },
  {
    id: 'row-2',
    region: '华北大区',
    lv3: '保险服务',
    lv4: '华为碎屏服务宝',
    offering: 'CAP-Mate-2BY242BCN',
    hardwareBU: 'Mate',
    hardwareLV3: '智能手机',
    hardwareOffering: 'HW-OFF-M60',
    priceFrom: '5001',
    priceTo: '10000',
    term: '24',
    count: '2',
    target: 'B',
    parts: '前壳,外屏,中框组件',
    status: 'valid'
  },
  {
    id: 'row-3',
    region: '华南大区',
    lv3: '保险服务',
    lv4: '华为全保服务宝',
    offering: 'BCAI-Hope-3CY121CAB',
    hardwareBU: 'Hope',
    hardwareLV3: '轻薄本',
    hardwareOffering: 'HW-OFF-BOOK',
    priceFrom: '3000',
    priceTo: '7000',
    term: '12',
    count: '1',
    target: 'C',
    parts: '屏幕组件,主板,键盘C壳,原装电池,电源适配器',
    status: 'valid'
  },
  {
    id: 'row-4',
    region: '华东大区',
    lv3: '保险服务',
    lv4: '华为延长保修',
    offering: 'WDP-Hope-4DY241CAB',
    hardwareBU: 'Hope',
    hardwareLV3: '台式机',
    hardwareOffering: 'HW-OFF-DESK',
    priceFrom: '4000',
    priceTo: '8000',
    term: '24',
    count: '1',
    target: 'C',
    parts: '主机整机,主板主电路,散热模组',
    status: 'valid'
  },
  {
    id: 'row-5',
    region: '全国通用',
    lv3: '保险服务',
    lv4: '华为意外服务宝',
    offering: 'ACAP-Mate-5EY121BAB',
    hardwareBU: 'Mate',
    hardwareLV3: '折叠屏手机',
    hardwareOffering: 'HW-OFF-FOLD',
    priceFrom: '10001',
    priceTo: '20000',
    term: '12',
    count: '1',
    target: 'B',
    parts: '屏幕模组,后盖总成,主板元器件,后置摄像头',
    status: 'valid'
  }
];

/**
 * Parses the offering string according to business rules:
 * - term: slice(-6, -4)
 * - count: slice(-4, -3)
 * - target: slice(-3, -2)
 */
export function parseOfferingString(s: string): DecodedOffering {
  const clean = (s || '').trim();
  if (clean.length < 6) {
    return {
      prefix: clean.split('-')[0] || '',
      middle: '',
      term: '',
      count: '',
      target: '',
      isValidLength: false,
      rawString: clean,
    };
  }

  const prefix = clean.split('-')[0] || '';
  const term = clean.slice(-6, -4);
  const count = clean.slice(-4, -3);
  const target = clean.slice(-3, -2);

  return {
    prefix,
    middle: clean.slice(prefix.length, -6),
    term,
    count,
    target,
    isValidLength: true,
    rawString: clean,
  };
}

/**
 * 格式化保障次数显示：
 * 0 代表 “不限次数”
 */
export function formatOfferingCount(count: string | undefined | null, withUnit = true): string {
  if (count === '0') return '不限次数';
  if (!count) return '-';
  return withUnit ? `${count}次` : count;
}

/**
 * Fully resolves a row based on offering code, hardware BU, and user configs.
 */
export function resolveOfferingRecord(
  data: Partial<OfferingRow>,
  prefixRules: PrefixRule[],
  partRules: PartRule[]
): OfferingRow {
  const offeringStr = (data.offering || '').trim();
  const region = data.region || '华东大区';
  const hardwareBU = (data.hardwareBU || '').trim();
  const hardwareLV3 = data.hardwareLV3 || '';
  const hardwareOffering = data.hardwareOffering || '';
  const priceFrom = data.priceFrom || '';
  const priceTo = data.priceTo || '';

  const parsed = parseOfferingString(offeringStr);

  // Match Prefix Rule
  const prefixMatch = parsed.prefix.toUpperCase();
  const prefixRule = prefixRules.find(
    (r) => r.prefix.trim().toUpperCase() === prefixMatch
  );

  const lv3 = prefixRule ? prefixRule.lv3 : (data.lv3 || '未匹配简称');
  const lv4 = prefixRule ? prefixRule.lv4 : (data.lv4 || '未匹配产品');

  // Match Parts Rule based on lv4 + hardwareBU
  let parts = '无匹配部件';
  if (lv4 && lv4 !== '未匹配产品' && hardwareBU) {
    const partRule = partRules.find(
      (r) =>
        r.lv4.trim().toLowerCase() === lv4.trim().toLowerCase() &&
        r.bu.trim().toLowerCase() === hardwareBU.toLowerCase()
    );
    if (partRule && partRule.parts) {
      parts = partRule.parts;
    }
  }

  // Validate status
  let status: 'valid' | 'warning' | 'error' = 'valid';
  let validationMsg = '';

  if (!offeringStr) {
    status = 'warning';
    validationMsg = '待输入 Offering 编码';
  } else if (!parsed.isValidLength) {
    status = 'error';
    validationMsg = '编码长度不足6位，无法截取期限/次数/对象';
  } else if (!prefixRule) {
    status = 'warning';
    validationMsg = `简称 [${parsed.prefix}] 未在规则库中配置`;
  } else if (parts === '无匹配部件') {
    status = 'warning';
    validationMsg = `未找到 [${lv4}] + [${hardwareBU}] 的维修部件映射`;
  }

  return {
    id: data.id || `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    region,
    lv3,
    lv4,
    offering: offeringStr,
    hardwareBU,
    hardwareLV3,
    hardwareOffering,
    priceFrom,
    priceTo,
    term: parsed.term,
    count: parsed.count,
    target: parsed.target,
    parts,
    status,
    validationMsg,
  };
}

/**
 * Splits region string by comma (English/Chinese) or ideographic comma (顿号).
 */
export function splitRegions(regionStr: string): string[] {
  if (!regionStr || !regionStr.trim()) return ['全国通用'];
  const splitted = regionStr
    .split(/[,，、]+/)
    .map((r) => r.trim())
    .filter(Boolean);
  return splitted.length > 0 ? splitted : ['全国通用'];
}

export const REGION_STANDARD_ORDER = [
  '华东大区',
  '华北大区',
  '华南大区',
  '华中大区',
  '西南大区',
  '西北大区',
  '东北大区',
  '全国通用',
];

/**
 * Sorts RiskTableRow list by region so identical regions are grouped together.
 * Within each region, rows are ordered by offering code, hardware BU, and display category.
 */
export function sortRiskTableRowsByRegion(rows: RiskTableRow[], asc = true): RiskTableRow[] {
  return [...rows].sort((a, b) => {
    if (a.region !== b.region) {
      const idxA = REGION_STANDARD_ORDER.indexOf(a.region);
      const idxB = REGION_STANDARD_ORDER.indexOf(b.region);
      let diff = 0;
      if (idxA !== -1 && idxB !== -1) {
        diff = idxA - idxB;
      } else if (idxA !== -1) {
        diff = -1;
      } else if (idxB !== -1) {
        diff = 1;
      } else {
        diff = a.region.localeCompare(b.region, 'zh-CN');
      }
      return asc ? diff : -diff;
    }
    // Same region: secondary sort by offering code, then hardwareBU, then display category
    if (a.offering !== b.offering) {
      return a.offering.localeCompare(b.offering, 'zh-CN');
    }
    if (a.hardwareBU !== b.hardwareBU) {
      return a.hardwareBU.localeCompare(b.hardwareBU, 'zh-CN');
    }
    return a.displayCategory.localeCompare(b.displayCategory, 'zh-CN');
  });
}

/**
 * Expands offering rows into multiple RiskTableRow entries by splitting both multiple regions and parts.
 * When a row has multiple regions (separated by , or ， or 、), each region is expanded as a distinct row.
 * Default sorts rows so identical regions are cleanly grouped together.
 */
export function generateRiskTableRows(
  tableData: OfferingRow[],
  existingRates?: Map<string, string>
): RiskTableRow[] {
  const result: RiskTableRow[] = [];

  tableData.forEach((row) => {
    const regions = splitRegions(row.region);
    const rawParts = row.parts ? row.parts.split(/[,，、]+/).map((p) => p.trim()).filter(Boolean) : [];
    const partsList = rawParts.length > 0 ? rawParts : ['整机保障/默认'];

    regions.forEach((regionName) => {
      partsList.forEach((part, partIndex) => {
        // Key to preserve user entered rates when regenerating
        const rateKey = `${row.offering}_${regionName}_${part}_${row.priceFrom}_${row.priceTo}`;
        const rawExistingRate = existingRates?.get(rateKey) || '';
        const existingRate = rawExistingRate;

        result.push({
          id: `risk-${row.id}-${regionName}-${partIndex}-${part}`,
          offeringRowId: row.id,
          region: regionName,
          lv3: row.lv3,
          lv4: row.lv4,
          offering: row.offering,
          hardwareBU: row.hardwareBU,
          hardwareLV3: row.hardwareLV3,
          hardwareOffering: row.hardwareOffering,
          priceFrom: row.priceFrom,
          priceTo: row.priceTo,
          target: row.target,
          term: row.term,
          count: row.count,
          displayCategory: part,
          riskRate: existingRate,
        });
      });
    });
  });

  // Default sort by identical region grouping
  return sortRiskTableRowsByRegion(result);
}

/**
 * Downloads a string content as CSV with UTF-8 BOM so Excel opens it with Chinese characters intact.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a styled native Excel file (.xlsx) with header styling, borders, and OpenXML encoding
 */
export async function downloadExcelTable(
  headers: { title: string; required?: boolean }[],
  rows: (string | number)[][],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('标准出险率导入表');

  // Add header row
  const headerTitles = headers.map((h) => `${h.required ? '*' : ''}${h.title}`);
  const headerRow = worksheet.addRow(headerTitles);

  // Style header row
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDCE6F1' },
    };
    cell.font = {
      name: '微软雅黑',
      size: 10,
      bold: true,
      color: { argb: 'FF1F497D' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });
  headerRow.height = 26;

  // Add data rows
  rows.forEach((rowData) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;
    row.eachCell((cell) => {
      cell.font = {
        name: '微软雅黑',
        size: 9,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Auto column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const valStr = cell.value ? String(cell.value) : '';
      if (valStr.length > maxLength) {
        maxLength = Math.min(valStr.length, 35);
      }
    });
    column.width = maxLength + 4;
  });

  // Generate buffer and trigger download in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const targetFilename = filename.endsWith('.xlsx') ? filename : filename.replace(/\.(xls|csv)$/, '') + '.xlsx';
  a.download = targetFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standard 6-column template CSV matching user's Excel copy-paste workflow:
 * 区域, 服务offering, 硬件BU, 硬件LV3, 硬件offering, 维修部件
 */
export const STANDARD_OFFERING_TEMPLATE_CSV =
  '区域,服务offering,硬件BU,硬件LV3,硬件offering\n' +
  '"中国地区部,欧洲地区部",ASDW-Hope-1AY121CAB,Hope,手机，"Hope-L29C，Hope-L09C，Hope-AL10D"\n' +
  '"中国地区部"，CAP-Mate-2BY242BCN,Mate,手机，"Hope-L29C、Hope-L09C、Hope-AL10D"';

/**
 * Parses user pasted text from Excel or CSV.
 * Standard format:
 * 1: 区域 (支持中英文逗号/顿号隔开多区域)
 * 2: 服务offering (自动解析LV3/LV4及期限/次数/对象)
 * 3: 硬件BU
 * 4: 硬件LV3
 * 5: 硬件offering / 型号
 * (可选) 6: 维修部件 (若未提供，则自动根据服务产品LV4+硬件BU从规则库匹配)
 * 设备价格(从/至)不填入数据，保持留空
 */
export function parseBatchInputText(
  text: string,
  prefixRules: PrefixRule[],
  partRules: PartRule[]
): OfferingRow[] {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const newRows: OfferingRow[] = [];

  // Helper to split CSV or Tab-delimited line safely respecting quotation marks and Chinese commas
  const splitLine = (line: string): string[] => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim());
    }
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'" || char === '“' || char === '”') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '，') && !inQuotes) {
        result.push(current.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim());
    return result;
  };

  for (const line of lines) {
    // Skip header lines
    if (
      line.includes('区域') &&
      (line.includes('Offering') || line.includes('offering') || line.includes('硬件BU') || line.includes('服务产品'))
    ) {
      continue;
    }

    const cols = splitLine(line);

    if (cols.length >= 10) {
      // Extended 13-column format
      const region = cols[0] || '华东大区';
      const lv3 = cols[1] || '';
      const lv4 = cols[2] || '';
      const offering = cols[3] || '';
      const hardwareBU = cols[4] || 'Hope';
      const hardwareLV3 = cols[5] || '';
      const hardwareOffering = cols[6] || '';
      const priceFrom = cols[7] || '';
      const priceTo = cols[8] || '';
      const term = cols[9] || '';
      const count = cols[10] || '';
      const target = cols[11] || '';
      const parts = cols[12] || '';

      const record = resolveOfferingRecord(
        {
          region,
          lv3,
          lv4,
          offering,
          hardwareBU,
          hardwareLV3,
          hardwareOffering,
          priceFrom,
          priceTo,
        },
        prefixRules,
        partRules
      );

      if (term) record.term = term;
      if (count) record.count = count;
      if (target) record.target = target;
      if (parts) record.parts = parts;
      if (lv3) record.lv3 = lv3;
      if (lv4) record.lv4 = lv4;

      newRows.push(record);
    } else if (cols.length >= 2) {
      // Standard Excel column format:
      // 0: 区域, 1: 服务offering, 2: 硬件BU, 3: 硬件LV3, 4: 硬件offering, 5: 维修部件 (可选)
      const region = cols[0] || '华东大区';
      const offering = cols[1] || '';
      const hardwareBU = cols[2] || 'Hope';
      const hardwareLV3 = cols[3] || '';
      
      const parts = cols.length >= 6 ? cols[cols.length - 1] : '';
      const hardwareOffering = cols.length >= 6
        ? cols.slice(4, cols.length - 1).filter(Boolean).join(', ')
        : (cols[4] || '');

      const record = resolveOfferingRecord(
        {
          region,
          offering,
          hardwareBU,
          hardwareLV3,
          hardwareOffering,
          priceFrom: '', // 设备价格档位不需要填入数据
          priceTo: '',   // 设备价格档位不需要填入数据
        },
        prefixRules,
        partRules
      );

      // Directly use parts from last column if explicitly provided (6 or more columns)
      if (parts && parts.trim()) {
        record.parts = parts.trim();
      }

      newRows.push(record);
    }
  }

  return newRows;
}

/**
 * 格式化出险率：默认按照百分比（%）填写，保留小数点后两位小数（例如 "3.50%"）。
 * 兼容处理：
 * 1. 含有 % / ％ 符号的字符串，如 "3.5%"、"4%" -> "3.50%"、"4.00%"
 * 2. 纯数字（如 3.5、4、10）-> "3.50%"、"4.00%"、"10.00%"
 * 3. 精算小数表示法（0 < x < 1，如 0.035、0.045、0.018）-> 自动乘以100并转换为 "3.50%"、"4.50%"、"1.80%"
 * 4. 0 或 0% -> "0.00%"
 */
export function formatRiskRate(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (!str) return '';

  // 包含中英文百分号
  if (str.includes('%') || str.includes('％')) {
    const rawNum = parseFloat(str.replace(/[%％]/g, '').trim());
    if (isNaN(rawNum)) return str;
    return `${rawNum.toFixed(2)}%`;
  }

  const num = parseFloat(str);
  if (isNaN(num)) return str;

  // 如果输入小于1且大于0的小数（如 0.035、0.045），说明用户按小数输入，自动乘以100转为百分比
  if (num > 0 && num < 1) {
    return `${(num * 100).toFixed(2)}%`;
  }

  // 其它数值（如 3.5、4、0）直接保留两位小数并加 %
  return `${num.toFixed(2)}%`;
}

/**
 * 解析出险率字符串为数字（百分比数值，例如 "3.50%" -> 3.5，0.035 -> 3.5），方便排序与平均数统计
 */
export function parseRiskRateToNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const str = String(value).trim();
  if (!str) return 0;

  if (str.includes('%') || str.includes('％')) {
    const num = parseFloat(str.replace(/[%％]/g, '').trim());
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num > 0 && num < 1) {
    return num * 100;
  }
  return num;
}
