export type DepthCategory = 'ankle' | 'knee' | 'waist_or_above';
export type DurationCategory = 'under_2h' | '2_to_6h' | '6_to_12h' | 'over_12h';
export type HotspotConfidence = 'seeded_only' | 'seeded_plus_reports' | 'reports_only';

export type SiteType = 'public_park' | 'institutional' | 'municipal_ground' | 'private_open';
export type SoilClass = 'sandy_loam' | 'loam' | 'silt_loam' | 'clay_loam';

export interface Coordinates {
  lat: number;
  lng: number;
  x: number; // Normalized 0-1000 for GIS canvas
  y: number; // Normalized 0-1000 for GIS canvas
}

export interface Hotspot {
  id: string;
  name: string;
  locationName: string;
  coords: Coordinates;
  elevation: number; // Meters above sea level (e.g., 208.5m - 215m)
  confidence: HotspotConfidence;
  reportCount: number;
  catchmentAreaM2: number; // Catchment area A
  landCover: {
    pavedPercent: number;
    roofPercent: number;
    greenPercent: number;
  };
  weightedRunoffCoeff: number; // C (0.25 - 0.92)
  typicalDepth: DepthCategory;
  typicalDuration: DurationCategory;
  sewageAdjacent: boolean; // Beside Barapullah/Kushak nala or major sewer
  nearestNalaDistanceM: number;
  historicalNotes: string;
}

export interface CandidateSite {
  id: string;
  name: string;
  type: SiteType;
  coords: Coordinates;
  elevation: number; // Meters above sea level
  totalAreaM2: number;
  usableAreaForStorageM2: number;
  soilClass: SoilClass;
  infiltrationRateMmHr: {
    low: number;
    base: number;
    high: number;
  };
  depthToWaterTableM: number; // Groundwater table depth in meters
  floodExposureRisk: 'low' | 'moderate' | 'high'; // Likely saturated in same storm
  distanceToSensorsOrNalaM: number;
  hasSensitiveNeighbour: boolean; // within 100m of landfill/industrial
  ownershipName: string;
  verifiedStatus: 'ground_verified' | 'osm_extracted';
}

export interface SafetyFlags {
  isSewageMixedRisk: boolean; // Requires detention only, no direct recharge
  requiresSiltTrapAndFirstFlush: boolean; // Always true for recharge
  shallowWaterTableWarning: boolean; // Water table < 3.0m bgl
  sensitiveNeighbourWarning: boolean; // Industrial / contamination risk
  drainDownExceeds48h: boolean;
  downgradedToDetentionOnly: boolean;
}

export interface VolumeEstimate {
  low: number;
  base: number;
  high: number;
}

export interface MatchedSite {
  site: CandidateSite;
  rank: number;
  flowPathDistanceM: number;
  elevationDropM: number; // Hotspot elevation - Site elevation (must be >= -0.3m)
  scoreBreakdown: {
    distanceScore: number;
    areaScore: number;
    soilScore: number;
    waterTableScore: number;
    floodExposureScore: number;
    feasibilityScore: number;
    totalWeightedScore: number;
  };
  suggestedStructure: {
    typeName: string;
    description: string;
    lengthM: number;
    widthM: number;
    depthM: number;
    voidRatio: number;
    infiltratingAreaM2: number;
    footprintM2: number;
  };
  storageVolumeM3: number; // V_store
  drainLimitedVolumeM3: VolumeEstimate; // V_drain over T (48h)
  designCapacityM3: VolumeEstimate; // V_design = min(V_store, V_drain)
  capturedPerStormM3: VolumeEstimate; // min(V_runoff_delivered, V_design)
  rechargePerStormM3: VolumeEstimate; // infiltrates within T
  annualRechargePotentialM3: VolumeEstimate; // Sum over qualifying storms in rainfall record (PRD Section 7)
  safetyFlags: SafetyFlags;
  status: 'recommended' | 'detention_only';
  plainLanguageReason: string;
}

export interface RejectedSite {
  site: CandidateSite;
  reason: 'uphill' | 'flood_prone_sink' | 'too_small' | 'water_body_or_road';
  details: string;
  elevationDiffM: number;
}

export interface HotspotMatchResult {
  hotspot: Hotspot;
  runoffVolumeM3: VolumeEstimate; // V_runoff = C * P * A
  topMatches: MatchedSite[];
  rejectedSites: RejectedSite[];
  absorptionGapM3: VolumeEstimate; // V_runoff - sum(V_design of matches)
  absorptionPercentage: number; // % of runoff captured
}

export interface ScoringWeights {
  distanceWeight: number; // 25% default
  areaWeight: number; // 20% default
  soilWeight: number; // 20% default
  waterTableWeight: number; // 15% default
  floodExposureWeight: number; // 10% default
  feasibilityWeight: number; // 10% default
}

export interface StormEvent {
  id: string;
  name: string;
  type: 'design_storm' | 'historical_replay';
  dateLabel: string;
  rainfallDepthMm: number; // P in mm
  durationHours: number;
  description: string;
  source: string;
}

export interface CitizenReport {
  id: string;
  hotspotId?: string;
  locationName: string;
  coords: Coordinates;
  depthCategory: DepthCategory;
  durationCategory: DurationCategory;
  photoUrl?: string;
  photoExifStripped: boolean;
  notes: string;
  timestamp: string;
  verifiedByPlanner: boolean;
}

export interface ExpertBackTestItem {
  hotspotId: string;
  hotspotName: string;
  algorithmTop3Ids: string[];
  expertTop3Ids: string[];
  agreementCount: number; // 0 to 3
  isMatch: boolean; // Overlap >= 2
  expertNotes: string;
  expertName: string;
}
