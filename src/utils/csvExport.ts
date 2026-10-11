import { HotspotMatchResult, StormEvent, ScoringWeights } from '../types/hydrology';

export function exportWardPlanToCsv(
  results: Record<string, HotspotMatchResult>,
  activeStorm: StormEvent,
  weights: ScoringWeights,
  wardName: string
) {
  const rows: string[][] = [];

  // Metadata headers
  rows.push(['RECHARGEMATCH WARD RUNOFF CAPTURE & RECHARGE PLAN']);
  rows.push(['Generated Date', new Date().toISOString()]);
  rows.push(['Target Ward', wardName]);
  rows.push(['Active Storm Scenario', `${activeStorm.name} (${activeStorm.rainfallDepthMm} mm over ${activeStorm.durationHours}h)`]);
  rows.push(['Rainfall Source', activeStorm.source]);
  rows.push([
    'Scoring Weights (Distance/Area/Soil/WaterTable/FloodExposure/Feasibility)',
    `${weights.distanceWeight}% / ${weights.areaWeight}% / ${weights.soilWeight}% / ${weights.waterTableWeight}% / ${weights.floodExposureWeight}% / ${weights.feasibilityWeight}%`,
  ]);
  rows.push(['Statutory Notice', 'Screening-level estimate. Needs site survey, infiltration test and professional hydrogeological review before construction.']);
  rows.push([]);

  // Table Column Headers
  rows.push([
    'Hotspot ID',
    'Hotspot Name',
    'Location',
    'Hotspot Elevation (m MSL)',
    'Catchment Area (m2)',
    'Runoff Coeff (C)',
    'Hotspot Runoff Base (m3)',
    'Runoff Range [Low-High m3]',
    'Rank',
    'Matched Site Name',
    'Site Ownership / Type',
    'Site Elevation (m MSL)',
    'Elevation Drop (m)',
    'Flow Distance (m)',
    'Soil Class',
    'Base Infiltration Rate (mm/h)',
    'Water Table Depth (m bgl)',
    'Suggested Structure Type',
    'Structure Dimensions (LxWxD m)',
    'Void Ratio',
    'Storage Volume (m3)',
    'Design Capacity Base (m3)',
    'Captured Flood Relief Base (m3)',
    'Groundwater Recharge Base (m3)',
    'Annual Recharge Potential (m3/yr)',
    'Captured Range [Low-High m3]',
    'Status',
    'Sewage Risk Flag',
    'Drain-Down < 48h Flag',
    'Composite Score (/100)',
    'Plain Language Justification',
  ]);

  for (const hsId in results) {
    const res = results[hsId];
    for (const match of res.topMatches) {
      rows.push([
        res.hotspot.id,
        `"${res.hotspot.name}"`,
        `"${res.hotspot.locationName}"`,
        res.hotspot.elevation.toFixed(1),
        res.hotspot.catchmentAreaM2.toString(),
        res.hotspot.weightedRunoffCoeff.toFixed(2),
        res.runoffVolumeM3.base.toString(),
        `"[${res.runoffVolumeM3.low} - ${res.runoffVolumeM3.high}]"`,
        match.rank.toString(),
        `"${match.site.name}"`,
        `"${match.site.ownershipName} (${match.site.type})"`,
        match.site.elevation.toFixed(1),
        match.elevationDropM.toFixed(1),
        match.flowPathDistanceM.toString(),
        match.site.soilClass,
        match.site.infiltrationRateMmHr.base.toString(),
        match.site.depthToWaterTableM.toFixed(1),
        `"${match.suggestedStructure.typeName}"`,
        `"${match.suggestedStructure.lengthM}m x ${match.suggestedStructure.widthM}m x ${match.suggestedStructure.depthM}m"`,
        match.suggestedStructure.voidRatio.toFixed(2),
        match.storageVolumeM3.toString(),
        match.designCapacityM3.base.toString(),
        match.capturedPerStormM3.base.toString(),
        match.rechargePerStormM3.base.toString(),
        (match.annualRechargePotentialM3?.base ?? match.rechargePerStormM3.base * 12).toString(),
        `"[${match.capturedPerStormM3.low} - ${match.capturedPerStormM3.high}]"`,
        match.status,
        match.safetyFlags.isSewageMixedRisk ? 'YES (DETENTION ONLY)' : 'NO',
        match.safetyFlags.drainDownExceeds48h ? 'EXCEEDS 48H' : 'PASSED (<48H)',
        match.scoreBreakdown.totalWeightedScore.toString(),
        `"${match.plainLanguageReason}"`,
      ]);
    }
  }

  // Add Rejected Uphill Summary
  rows.push([]);
  rows.push(['REJECTED SITES AUDIT (HARD FILTER ENFORCEMENT)']);
  rows.push(['Hotspot ID', 'Hotspot Name', 'Rejected Site Name', 'Reason Code', 'Elevation Difference', 'Physical Justification']);

  for (const hsId in results) {
    const res = results[hsId];
    for (const rej of res.rejectedSites) {
      rows.push([
        res.hotspot.id,
        `"${res.hotspot.name}"`,
        `"${rej.site.name}"`,
        rej.reason.toUpperCase(),
        rej.elevationDiffM < 0 ? `+${Math.abs(rej.elevationDiffM).toFixed(1)}m uphill` : `${rej.elevationDiffM.toFixed(1)}m`,
        `"${rej.details}"`,
      ]);
    }
  }

  // Convert to CSV string and download
  const csvContent = rows.map((e) => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RechargeMatch_${wardName.replace(/\s+/g, '_')}_Plan_${activeStorm.rainfallDepthMm}mm.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
