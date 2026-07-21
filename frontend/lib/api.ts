const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API = rawApi.replace(/\/+$/, '');

export interface CropScore {
  crop: string;
  score: number;
}

export interface SensorReading {
  id: number;
  device_id: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  moisture: number;
  humidity: number;
  timestamp: string;
  health_label: string | null;
  confidence_score: number | null;
  recommended_crop?: string | null;
  crop_confidence?: number | null;
  top_crops?: CropScore[] | null;
}

export interface HistoryResponse {
  device_id: string;
  hours: number;
  count: number;
  data: SensorReading[];
}

export interface NoDataResponse {
  status: 'no_data';
  device_id: string;
}

export type CurrentResponse = SensorReading | NoDataResponse;

export function isNoData(r: CurrentResponse): r is NoDataResponse {
  return (r as NoDataResponse).status === 'no_data';
}

export async function fetchCurrent(deviceId = 'rover_01'): Promise<CurrentResponse> {
  const res = await fetch(`${API}/api/dashboard/current?device_id=${deviceId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchHistory(deviceId = 'rover_01', hours = 24): Promise<HistoryResponse> {
  const res = await fetch(
    `${API}/api/dashboard/history?device_id=${deviceId}&hours=${hours}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function postSimulate(deviceId = 'rover_01'): Promise<SensorReading> {
  const res = await fetch(`${API}/api/simulate?device_id=${deviceId}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
