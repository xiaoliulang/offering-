export interface PrefixRule {
  id: string;
  prefix: string;
  lv3: string;
  lv4: string;
  remark?: string;
}

export interface PartRule {
  id: string;
  lv4: string;
  bu: string;
  parts: string; // Comma-separated parts
}

export interface RegionItem {
  id: string;
  name: string;
  remark: string;
}

export interface OfferingRow {
  id: string;
  region: string;
  lv3: string;
  lv4: string;
  offering: string;
  hardwareBU: string;
  hardwareLV3: string;
  hardwareOffering: string;
  priceFrom: string;
  priceTo: string;
  term: string;
  count: string;
  target: string;
  parts: string;
  status?: 'valid' | 'warning' | 'error';
  validationMsg?: string;
}

export interface RiskTableRow {
  id: string;
  offeringRowId: string;
  region: string;
  lv3: string;
  lv4: string;
  offering: string;
  hardwareBU: string;
  hardwareLV3: string;
  hardwareOffering: string;
  priceFrom: string;
  priceTo: string;
  target: string;
  term: string;
  count: string;
  displayCategory: string; // 维修部件 -> 前台展示分类
  riskRate: string; // 出险率
}

export interface DecodedOffering {
  prefix: string;
  middle: string;
  term: string;
  count: string;
  target: string;
  isValidLength: boolean;
  rawString: string;
}

export interface HistoryRiskRecord {
  id: string;
  batchId: string;
  savedAt: string;
  region: string;
  lv3: string;
  lv4: string;
  hardwareBU: string;
  hardwareLV3: string;
  hardwareOffering: string;
  target: string;
  term: string;
  count: string;
  part: string;
  riskRate: string;
}
