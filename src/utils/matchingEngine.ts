import {
  Hotspot,
  CandidateSite,
  MatchedSite,
  RejectedSite,
  HotspotMatchResult,
  ScoringWeights,
  StormEvent,
  VolumeEstimate,
  SafetyFlags,
} from '../types/hydrology';

/**
 * Calculates flow-path distance in meters based on coordinate offset with tortuosity factor
 */
export function calculateFlowDistanceM(
  hsCoords: { lat: number; lng: number },
  siteCoords: { lat: number; lng: number }
): number {
  // Rough degree-to-meter conversion around 28.5°N
  const dLat = (siteCoords.lat - hsCoords.lat) * 111139;
  const dLng = (siteCoords.lng - hsCoords.lng) * 97800;
  const straightLine = Math.sqrt(dLat * dLat + dLng * dLng);
  // Real urban flow paths follow roads, curbs, and alleyways -> 1.25x tortuosity factor
  return Math.round(straightLine * 1.25);
}

/**
 * Structure type sizing and selection
 */
function determineStructure(
  site: CandidateSite,
  hotspot: Hotspot,
  usableAreaM2: number,
  sewageAdjacent: boolean
) {
  if (sewageAdjacent) {
    // Detention basin only
    const area = Math.min(usableAreaM2 * 0.4, 400);
    const length = Math.round(Math.sqrt(area * 1.5));
    const width = Math.round(area / length);
    const depth = 1.5;
    return {
      typeName: 'Bio-Detention Basin (Pre-Treatment Only)',
      description: 'Vegetated surface detention basin with settling forebay. Holds runoff to attenuate peak surge; no direct aquifer injection to prevent sewer contamination.',
      lengthM: length,
      widthM: width,
      depthM: depth,
      voidRatio: 1.0, // Open surface pond
      infiltratingAreaM2: Math.round(length * width),
      footprintM2: Math.round(length * width),
    };
  }

  if (site.type === 'institutional') {
    // Rooftop rainwater harvesting shaft + filter bed
    const area = Math.min(usableAreaM2 * 0.25, 250);
    const length = Math.round(Math.sqrt(area));
    const width = Math.round(area / length);
    const depth = 3.0;
    return {
      typeName: 'Campus Recharge Shaft with Dual Silt Trap',
      description: 'Decentralized institutional recharge shaft with sand-gravel filtration chamber, first-flush diverter, and slotted PVC intake.',
      lengthM: length,
      widthM: width,
      depthM: depth,
      voidRatio: 0.85,
      infiltratingAreaM2: Math.round(length * width),
      footprintM2: Math.round(length * width),
    };
  }

  if (site.type === 'public_park') {
    // Perimeter recharge trench with silt trap
    const length = Math.min(Math.round(Math.sqrt(usableAreaM2) * 2.5), 80);
    const width = 2.5;
    const depth = 2.5;
    return {
      typeName: 'Park Perimeter Infiltration Trench with Silt Trap',
      description: 'Linear gravel-filled trench along park boundary with pre-settling silt catchpits, geofabric wrap, and perforated collector pipes.',
      lengthM: length,
      widthM: width,
      depthM: depth,
      voidRatio: 0.4, // Graded gravel fill
      infiltratingAreaM2: Math.round(length * width + 2 * length * depth), // Floor + side walls
      footprintM2: Math.round(length * width),
    };
  }

  // Open ground / Municipal ground
  const length = 12;
  const width = 8;
  const depth = 3.0;
  return {
    typeName: 'Multi-Stage Infiltration Pit with First-Flush Chamber',
    description: 'Rectangular recharge pit with masonry desilting chamber, oil/grease baffle, and coarse aggregate aquifer recharge column.',
    lengthM: length,
    widthM: width,
    depthM: depth,
    voidRatio: 0.45,
    infiltratingAreaM2: Math.round(length * width),
    footprintM2: Math.round(length * width),
  };
}

/**
 * Evaluates candidate sites against a single hotspot
 */
export function matchHotspotToSites(
  hotspot: Hotspot,
  candidateSites: CandidateSite[],
  storm: StormEvent,
  weights: ScoringWeights
): HotspotMatchResult {
  // Step 1: Runoff Volume V_runoff = C * P * A
  const rainfallDepthM = storm.rainfallDepthMm / 1000;
  const areaM2 = hotspot.catchmentAreaM2;
  const C_base = hotspot.weightedRunoffCoeff;
  const C_low = Math.max(0.1, C_base * 0.9);
  const C_high = Math.min(0.98, C_base * 1.08);

  const runoffVolumeM3: VolumeEstimate = {
    low: Math.round(C_low * rainfallDepthM * areaM2),
    base: Math.round(C_base * rainfallDepthM * areaM2),
    high: Math.round(C_high * rainfallDepthM * areaM2),
  };

  const rejectedSites: RejectedSite[] = [];
  const qualifiedMatches: Omit<MatchedSite, 'rank'>[] = [];

  const DEM_ERROR_TOLERANCE_M = 0.3; // 30 cm tolerance for open DEM noise

  for (const site of candidateSites) {
    const flowDistM = calculateFlowDistanceM(hotspot.coords, site.coords);
    const elevationDiffM = Number((hotspot.elevation - site.elevation).toFixed(2));

    // Hard Filter 1: Reachable by Gravity
    // Site must not be uphill: site elevation must be <= hotspot elevation + tolerance
    if (site.elevation > hotspot.elevation + DEM_ERROR_TOLERANCE_M) {
      rejectedSites.push({
        site,
        reason: 'uphill',
        details: `Hydraulically uphill: Site elevation (${site.elevation.toFixed(1)}m MSL) is higher than hotspot (${hotspot.elevation.toFixed(1)}m MSL) by ${(site.elevation - hotspot.elevation).toFixed(1)}m. Overland gravity flow is impossible without mechanical lift pumps.`,
        elevationDiffM,
      });
      continue;
    }

    // Hard Filter 2: Site itself is flood-prone sink
    if (site.floodExposureRisk === 'high' && site.elevation < 208.2 && site.distanceToSensorsOrNalaM < 30) {
      rejectedSites.push({
        site,
        reason: 'flood_prone_sink',
        details: `Site is located within a recorded low-lying depression (${site.elevation.toFixed(1)}m MSL) adjacent to drain siltation. Directing further runoff would exacerbate localized submergence.`,
        elevationDiffM,
      });
      continue;
    }

    // Hard Filter 3: Minimum usable area
    if (site.usableAreaForStorageM2 < 50) {
      rejectedSites.push({
        site,
        reason: 'too_small',
        details: `Usable area (${site.usableAreaForStorageM2} m²) is below minimum structure threshold (50 m²).`,
        elevationDiffM,
      });
      continue;
    }

    // Hard Filter 4: Search radius (within 1600m flow-path)
    if (flowDistM > 1600) {
      continue; // Skip silently if outside reasonable neighborhood radius
    }

    // Step 2: Scoring Heuristic Factors
    // Factor 1: Flow-path distance (25% weight)
    const distScore = Math.max(0, 1 - flowDistM / 1500);

    // Factor 2: Available area for storage (20% weight)
    const areaScore = Math.min(1, site.usableAreaForStorageM2 / 3000);

    // Factor 3: Soil infiltration suitability (20% weight)
    const soilScoreMap: Record<string, number> = {
      sandy_loam: 1.0,
      loam: 0.75,
      silt_loam: 0.45,
      clay_loam: 0.2,
    };
    const soilScore = soilScoreMap[site.soilClass] || 0.5;

    // Factor 4: Depth to water table (15% weight - shallow table penalised)
    // CGWB recommends > 3m-5m depth for recharge to ensure unsaturated vadose zone
    let waterTableScore = 1.0;
    if (site.depthToWaterTableM < 3.0) {
      waterTableScore = 0.15; // Shallow table penalised heavily
    } else if (site.depthToWaterTableM < 5.0) {
      waterTableScore = 0.5;
    } else if (site.depthToWaterTableM < 10.0) {
      waterTableScore = 0.85;
    } else {
      waterTableScore = 1.0;
    }

    // Factor 5: Site flood exposure (10% weight)
    const exposureScore = site.floodExposureRisk === 'low' ? 1.0 : site.floodExposureRisk === 'moderate' ? 0.6 : 0.2;

    // Factor 6: Land-use and access feasibility (10% weight)
    const feasibilityScoreMap: Record<string, number> = {
      public_park: 1.0,
      municipal_ground: 0.9,
      institutional: 0.8,
      private_open: 0.4,
    };
    const feasibilityScore = feasibilityScoreMap[site.type] || 0.6;

    // Total weighted score
    const totalWeightSum =
      weights.distanceWeight +
      weights.areaWeight +
      weights.soilWeight +
      weights.waterTableWeight +
      weights.floodExposureWeight +
      weights.feasibilityWeight;

    const weightedScore =
      (distScore * weights.distanceWeight +
        areaScore * weights.areaWeight +
        soilScore * weights.soilWeight +
        waterTableScore * weights.waterTableWeight +
        exposureScore * weights.floodExposureWeight +
        feasibilityScore * weights.feasibilityWeight) /
      (totalWeightSum || 100);

    // Step 3: Safety and Quality Gate (Section 6.3)
    const isSewageMixedRisk = hotspot.sewageAdjacent || site.distanceToSensorsOrNalaM < 40;
    const shallowWaterTableWarning = site.depthToWaterTableM < 3.0;
    const sensitiveNeighbourWarning = site.hasSensitiveNeighbour;
    const downgradedToDetentionOnly = isSewageMixedRisk;

    const safetyFlags: SafetyFlags = {
      isSewageMixedRisk,
      requiresSiltTrapAndFirstFlush: true, // Mandatory for all urban runoff
      shallowWaterTableWarning,
      sensitiveNeighbourWarning,
      drainDownExceeds48h: false, // Calculated below
      downgradedToDetentionOnly,
    };

    // Step 4: Suggested Structure and Capacity (Section 7)
    const structure = determineStructure(
      site,
      hotspot,
      site.usableAreaForStorageM2,
      downgradedToDetentionOnly
    );

    // V_store = L * W * D * void_ratio
    const storageVolumeM3 = Math.round(
      structure.lengthM * structure.widthM * structure.depthM * structure.voidRatio
    );

    // V_drain = f * A_floor * T (T = 48h design drain-down time)
    const DESIGN_DRAIN_DOWN_TIME_HOURS = 48;
    const drainLimitedVolumeM3: VolumeEstimate = {
      low: Math.round((site.infiltrationRateMmHr.low / 1000) * structure.infiltratingAreaM2 * DESIGN_DRAIN_DOWN_TIME_HOURS),
      base: Math.round((site.infiltrationRateMmHr.base / 1000) * structure.infiltratingAreaM2 * DESIGN_DRAIN_DOWN_TIME_HOURS),
      high: Math.round((site.infiltrationRateMmHr.high / 1000) * structure.infiltratingAreaM2 * DESIGN_DRAIN_DOWN_TIME_HOURS),
    };

    // Check if drain down time is too slow (> 48h to empty storage)
    const hoursToDrain = storageVolumeM3 / ((site.infiltrationRateMmHr.base / 1000) * structure.infiltratingAreaM2);
    if (hoursToDrain > DESIGN_DRAIN_DOWN_TIME_HOURS) {
      safetyFlags.drainDownExceeds48h = true;
    }

    // V_design = min(V_store, V_drain)
    const designCapacityM3: VolumeEstimate = {
      low: Math.min(storageVolumeM3, drainLimitedVolumeM3.low),
      base: Math.min(storageVolumeM3, drainLimitedVolumeM3.base),
      high: Math.min(storageVolumeM3, drainLimitedVolumeM3.high),
    };

    // Captured per storm = min(V_runoff_delivered, V_design)
    // Assume up to 80% of hotspot runoff can be delivered via street gutters / swales
    const deliveredRunoffM3 = {
      low: Math.round(runoffVolumeM3.low * 0.8),
      base: Math.round(runoffVolumeM3.base * 0.8),
      high: Math.round(runoffVolumeM3.high * 0.8),
    };

    const capturedPerStormM3: VolumeEstimate = {
      low: Math.min(deliveredRunoffM3.low, designCapacityM3.low),
      base: Math.min(deliveredRunoffM3.base, designCapacityM3.base),
      high: Math.min(deliveredRunoffM3.high, designCapacityM3.high),
    };

    // Recharge per storm = captured volume that infiltrates within T
    // If downgraded to detention only (sewage-mixed), direct recharge is 0 m³
    const rechargePerStormM3: VolumeEstimate = downgradedToDetentionOnly
      ? { low: 0, base: 0, high: 0 }
      : {
          low: Math.min(capturedPerStormM3.low, drainLimitedVolumeM3.low),
          base: Math.min(capturedPerStormM3.base, drainLimitedVolumeM3.base),
          high: Math.min(capturedPerStormM3.high, drainLimitedVolumeM3.high),
        };

    // Plain language reason
    let plainReason = '';
    if (downgradedToDetentionOnly) {
      plainReason = `Downhill by ${elevationDiffM.toFixed(1)}m (${flowDistM}m flow path). Downgraded to detention-only: adjacent to open drain with high sewage risk; cannot recharge groundwater untreated.`;
    } else {
      plainReason = `Downhill by ${elevationDiffM.toFixed(1)}m over ${flowDistM}m flow path. Favorable ${site.soilClass.replace('_', ' ')} soil (base ${site.infiltrationRateMmHr.base} mm/h) with ${site.depthToWaterTableM.toFixed(1)}m unsaturated vadose zone.`;
    }

    // Annual recharge potential (PRD Section 7): Sum over qualifying storms in rainfall record
    // In Delhi Older Alluvium regime (IMD Safdarjung normal 792mm), ~12 qualifying events >20mm spaced >48h apart
    const QUALIFYING_MONSOON_STORMS_PER_YEAR = 12;
    const annualRechargePotentialM3: VolumeEstimate = {
      low: rechargePerStormM3.low * 10,
      base: rechargePerStormM3.base * QUALIFYING_MONSOON_STORMS_PER_YEAR,
      high: rechargePerStormM3.high * 14,
    };

    qualifiedMatches.push({
      site,
      flowPathDistanceM: flowDistM,
      elevationDropM: elevationDiffM,
      scoreBreakdown: {
        distanceScore: Math.round(distScore * 100),
        areaScore: Math.round(areaScore * 100),
        soilScore: Math.round(soilScore * 100),
        waterTableScore: Math.round(waterTableScore * 100),
        floodExposureScore: Math.round(exposureScore * 100),
        feasibilityScore: Math.round(feasibilityScore * 100),
        totalWeightedScore: Math.round(weightedScore * 100),
      },
      suggestedStructure: structure,
      storageVolumeM3,
      drainLimitedVolumeM3,
      designCapacityM3,
      capturedPerStormM3,
      rechargePerStormM3,
      annualRechargePotentialM3,
      safetyFlags,
      status: downgradedToDetentionOnly ? 'detention_only' : 'recommended',
      plainLanguageReason: plainReason,
    });
  }

  // Sort qualified matches by total score descending
  qualifiedMatches.sort(
    (a, b) => b.scoreBreakdown.totalWeightedScore - a.scoreBreakdown.totalWeightedScore
  );

  // Take top 3 ranked sites
  const topMatches: MatchedSite[] = qualifiedMatches.slice(0, 3).map((match, idx) => ({
    ...match,
    rank: idx + 1,
  }));

  // Calculate Absorption Gap
  // Total design capacity of recommended matches
  const totalCapturedBase = topMatches.reduce((acc, m) => acc + m.capturedPerStormM3.base, 0);
  const totalCapturedLow = topMatches.reduce((acc, m) => acc + m.capturedPerStormM3.low, 0);
  const totalCapturedHigh = topMatches.reduce((acc, m) => acc + m.capturedPerStormM3.high, 0);

  const absorptionGapM3: VolumeEstimate = {
    low: Math.max(0, runoffVolumeM3.low - totalCapturedHigh),
    base: Math.max(0, runoffVolumeM3.base - totalCapturedBase),
    high: Math.max(0, runoffVolumeM3.high - totalCapturedLow),
  };

  const absorptionPercentage =
    runoffVolumeM3.base > 0
      ? Math.min(100, Math.round((totalCapturedBase / runoffVolumeM3.base) * 100))
      : 0;

  return {
    hotspot,
    runoffVolumeM3,
    topMatches,
    rejectedSites,
    absorptionGapM3,
    absorptionPercentage,
  };
}

/**
 * Runs the matching algorithm across all hotspots in the ward
 */
export function runWardMatching(
  hotspots: Hotspot[],
  candidateSites: CandidateSite[],
  storm: StormEvent,
  weights: ScoringWeights
): {
  results: Record<string, HotspotMatchResult>;
  wardSummary: {
    totalRunoffM3: VolumeEstimate;
    totalCapturedM3: VolumeEstimate;
    totalRechargedM3: VolumeEstimate;
    totalAnnualRechargeM3?: VolumeEstimate;
    wardAbsorptionGapM3: VolumeEstimate;
    absorptionPercentage: number;
    recommendedStructuresCount: number;
    detentionOnlyStructuresCount: number;
    rejectedUphillCount: number;
  };
} {
  const results: Record<string, HotspotMatchResult> = {};

  let totalRunoffLow = 0;
  let totalRunoffBase = 0;
  let totalRunoffHigh = 0;

  let totalCapturedLow = 0;
  let totalCapturedBase = 0;
  let totalCapturedHigh = 0;

  let totalRechargedLow = 0;
  let totalRechargedBase = 0;
  let totalRechargedHigh = 0;

  let recommendedStructuresCount = 0;
  let detentionOnlyStructuresCount = 0;
  let rejectedUphillCount = 0;

  for (const hs of hotspots) {
    const match = matchHotspotToSites(hs, candidateSites, storm, weights);
    results[hs.id] = match;

    totalRunoffLow += match.runoffVolumeM3.low;
    totalRunoffBase += match.runoffVolumeM3.base;
    totalRunoffHigh += match.runoffVolumeM3.high;

    for (const m of match.topMatches) {
      totalCapturedLow += m.capturedPerStormM3.low;
      totalCapturedBase += m.capturedPerStormM3.base;
      totalCapturedHigh += m.capturedPerStormM3.high;

      totalRechargedLow += m.rechargePerStormM3.low;
      totalRechargedBase += m.rechargePerStormM3.base;
      totalRechargedHigh += m.rechargePerStormM3.high;

      if (m.status === 'recommended') {
        recommendedStructuresCount += 1;
      } else {
        detentionOnlyStructuresCount += 1;
      }
    }

    rejectedUphillCount += match.rejectedSites.filter((r) => r.reason === 'uphill').length;
  }

  const wardAbsorptionGapM3: VolumeEstimate = {
    low: Math.max(0, totalRunoffLow - totalCapturedHigh),
    base: Math.max(0, totalRunoffBase - totalCapturedBase),
    high: Math.max(0, totalRunoffHigh - totalCapturedLow),
  };

  const absorptionPercentage =
    totalRunoffBase > 0 ? Math.min(100, Math.round((totalCapturedBase / totalRunoffBase) * 100)) : 0;

  return {
    results,
    wardSummary: {
      totalRunoffM3: { low: totalRunoffLow, base: totalRunoffBase, high: totalRunoffHigh },
      totalCapturedM3: { low: totalCapturedLow, base: totalCapturedBase, high: totalCapturedHigh },
      totalRechargedM3: { low: totalRechargedLow, base: totalRechargedBase, high: totalRechargedHigh },
      totalAnnualRechargeM3: {
        low: totalRechargedLow * 10,
        base: totalRechargedBase * 12,
        high: totalRechargedHigh * 14,
      },
      wardAbsorptionGapM3,
      absorptionPercentage,
      recommendedStructuresCount,
      detentionOnlyStructuresCount,
      rejectedUphillCount,
    },
  };
}

/**
 * Section 7 Worked Example Verification
 * A = 20,000 m², P = 60 mm (0.060 m), C = 0.85
 * V_runoff = 0.85 * 0.060 * 20,000 = 1,020 m³
 * Candidate pit: 10m x 10m x 3m (void factor 1.0) = 300 m³
 * Soil infiltration f = 20 mm/h (0.020 m/h), T = 48 h, floor area = 100 m²
 * V_drain = 0.020 * 100 * 48 = 96 m³
 * V_design = min(300, 96) = 96 m³
 * Absorption gap = 1,020 - 96 = 924 m³
 */
export function verifyWorkedExample() {
  const A = 20000;
  const P = 0.060;
  const C = 0.85;
  const V_runoff = Math.round(C * P * A); // 1020

  const L = 10;
  const W = 10;
  const D = 3;
  const voidFactor = 1.0;
  const V_store = Math.round(L * W * D * voidFactor); // 300

  const f = 0.020; // 20 mm/h in m/h
  const A_floor = 100;
  const T = 48;
  const V_drain = Math.round(f * A_floor * T); // 96

  const V_design = Math.min(V_store, V_drain); // 96
  const V_captured = Math.min(V_runoff, V_design); // 96
  const absorptionGap = Math.round(V_runoff - V_design); // 924

  return {
    V_runoff,
    V_store,
    V_drain,
    V_design,
    V_captured,
    absorptionGap,
    isCorrect:
      V_runoff === 1020 &&
      V_store === 300 &&
      V_drain === 96 &&
      V_design === 96 &&
      absorptionGap === 924,
  };
}

