import {
  PrefixRule,
  PartRule,
  RegionItem,
  OfferingRow,
  HistoryRiskRecord,
} from '../types/offering';

export interface InitialDataResponse {
  prefixRules: PrefixRule[];
  partRules: PartRule[];
  regionTable: RegionItem[];
  tableData: OfferingRow[];
  ratesObj: Record<string, string>;
  historyRecords: HistoryRiskRecord[];
}

export async function fetchInitialData(): Promise<InitialDataResponse | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('API fetchInitialData failed, fallback to local storage:', err);
  }
  return null;
}

export async function syncPrefixRules(rules: PrefixRule[]): Promise<boolean> {
  try {
    const res = await fetch('/api/prefix-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API syncPrefixRules failed:', err);
    return false;
  }
}

export async function syncPartRules(rules: PartRule[]): Promise<boolean> {
  try {
    const res = await fetch('/api/part-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API syncPartRules failed:', err);
    return false;
  }
}

export async function syncRegions(regions: RegionItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regions }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API syncRegions failed:', err);
    return false;
  }
}

export async function syncWorkbench(rows: OfferingRow[]): Promise<boolean> {
  try {
    const res = await fetch('/api/workbench', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API syncWorkbench failed:', err);
    return false;
  }
}

export async function syncRates(rateMap: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateMap }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API syncRates failed:', err);
    return false;
  }
}

export async function saveHistoryToBackend(records: HistoryRiskRecord[]): Promise<boolean> {
  try {
    const res = await fetch('/api/history-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API saveHistoryToBackend failed:', err);
    return false;
  }
}

export async function deleteHistoryRecordOnBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/history-records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('API deleteHistoryRecordOnBackend failed:', err);
    return false;
  }
}

export async function deleteHistoryBatchOnBackend(batchId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/history-records/batch/${encodeURIComponent(batchId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('API deleteHistoryBatchOnBackend failed:', err);
    return false;
  }
}

export async function clearAllHistoryOnBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/history-records/clear', {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.warn('API clearAllHistoryOnBackend failed:', err);
    return false;
  }
}

export async function resetDefaultConfigsOnBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/reset-default-configs', {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.warn('API resetDefaultConfigsOnBackend failed:', err);
    return false;
  }
}
