import { CitizenReport, Hotspot, CandidateSite } from '../types/hydrology';

const API_BASE_URL = (import.meta as any).env?.VITE_AWS_API_GATEWAY_URL || '';

export function isAwsConfigured(): boolean {
  return Boolean(API_BASE_URL && API_BASE_URL.trim().length > 0);
}

export async function fetchWardDatasetFromAws(wardId = 'ward-142'): Promise<{
  hotspots: Hotspot[];
  candidateSites: CandidateSite[];
  reports: CitizenReport[];
} | null> {
  if (!isAwsConfigured()) return null;

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/wards/${wardId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitCitizenReportToAws(
  report: CitizenReport
): Promise<{ synced: boolean; reportId: string }> {
  if (!isAwsConfigured()) {
    return { synced: false, reportId: report.id };
  }

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) {
      return { synced: false, reportId: report.id };
    }
    const data = await response.json();
    return { synced: true, reportId: data.id || report.id };
  } catch {
    return { synced: false, reportId: report.id };
  }
}

export async function uploadReportPhotoToS3(file: File): Promise<string | null> {
  if (!isAwsConfigured()) return null;

  try {
    const presignRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/uploads/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!presignRes.ok) return null;
    const { uploadUrl, publicFileUrl } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    return putRes.ok ? publicFileUrl : null;
  } catch {
    return null;
  }
}
