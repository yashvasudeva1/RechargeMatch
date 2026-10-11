import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Crosshair,
  Bookmark,
  Share2,
  X,
  Leaf,
  Trees,
  MessageSquare,
} from 'lucide-react';
import { HotspotMatchResult, CandidateSite } from '../types/hydrology';

interface HotspotPanelProps {
  matchResult: HotspotMatchResult | null;
  selectedMatchRank?: number;
  onSelectMatchRank?: (rank: number) => void;
  onSelectSite: (site: CandidateSite | null) => void;
  onOpenReportModal: () => void;
  onOpenAssumptionsModal: () => void;
}

export const HotspotPanel: React.FC<HotspotPanelProps> = ({
  matchResult,
  selectedMatchRank = 1,
  onSelectMatchRank,
  onSelectSite,
  onOpenReportModal,
  onOpenAssumptionsModal,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'hydrology' | 'design' | 'reports' | 'nearby'>('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [memoCopied, setMemoCopied] = useState(false);
  const [focusedOnMap, setFocusedOnMap] = useState(false);

  if (!matchResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#3B5988] bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl font-sans">
        <h3 className="font-serif text-lg font-semibold text-[#0F2D59]">Select a Flood Hotspot</h3>
        <p className="text-xs text-[#4A6588] max-w-xs mt-1.5 leading-relaxed">
          Select any waterlogging marker on the map to inspect upstream catchment hydrology, gravity flow paths, and ranked recharge structures.
        </p>
      </div>
    );
  }

  const { hotspot, runoffVolumeM3, topMatches, rejectedSites, absorptionGapM3, absorptionPercentage } =
    matchResult;

  const activeMatch =
    topMatches.find((m) => m.rank === selectedMatchRank) || topMatches[0];

  const confidenceBadgeLabel: Record<string, string> = {
    seeded_only: 'Baseline',
    seeded_plus_reports: 'Verified',
    reports_only: 'Crowdsourced',
  };

  const handleCopyMemo = () => {
    if (!activeMatch) return;
    const memoText = `CIVIL ENGINEERING SITING MEMORANDUM (SCREENING-LEVEL)
Date: ${new Date().toLocaleDateString('en-GB')}
To: Delhi Jal Board / Municipal Corporation of Delhi (Ward 142 Drainage Cell)
Subject: Gravity Runoff Siting & Infiltration Sizing for ${hotspot.name}

1. ORIGIN WATERLOGGING PROBLEM
- Hotspot: ${hotspot.name} (${hotspot.locationName})
- Surface Elevation: ${hotspot.elevation.toFixed(1)} m MSL
- Upstream Impervious Catchment: ${hotspot.catchmentAreaM2.toLocaleString()} m² (Runoff Coeff C=${hotspot.weightedRunoffCoeff})
- Computed Sheet Runoff: ${runoffVolumeM3.base.toLocaleString()} m³ [Range: ${runoffVolumeM3.low} - ${runoffVolumeM3.high} m³]

2. RECOMMENDED DOWNHILL SINK
- Site: ${activeMatch.site.name} (${activeMatch.site.ownershipName})
- Site Elevation: ${activeMatch.site.elevation.toFixed(1)} m MSL (Net Gravity Head: ↓ ${activeMatch.elevationDropM.toFixed(1)}m drop)
- Overland Flow-Path Distance: ${activeMatch.flowPathDistanceM} meters
- Proposed Structure: ${activeMatch.suggestedStructure.typeName}
- Footprint Dimensions: ${activeMatch.suggestedStructure.lengthM}m x ${activeMatch.suggestedStructure.widthM}m x ${activeMatch.suggestedStructure.depthM}m

3. HYDRAULIC SIZING & CAPACITY
- Physical Tank Storage (V_store): ${activeMatch.storageVolumeM3} m³
- Soil Percolation over 48h (V_drain): ${activeMatch.drainLimitedVolumeM3.base} m³ (${activeMatch.site.soilClass.replace('_', ' ')} @ ${activeMatch.site.infiltrationRateMmHr.base} mm/h)
- Design Capture Capacity: ${activeMatch.capturedPerStormM3.base.toLocaleString()} m³ per event
- Annual Groundwater Recharge: ~${(activeMatch.annualRechargePotentialM3?.base ?? activeMatch.rechargePerStormM3.base * 12).toLocaleString()} m³/year

4. SCREENING-LEVEL QUALITY & SAFETY GATES
- Mandatory Silt Trap & First-Flush Chamber required.
- Sewage Contamination Check: ${activeMatch.safetyFlags.isSewageMixedRisk ? 'RISK DETECTED (Detention only, no direct well injection)' : 'PASSED (Separated stormwater catchment)'}
- Vadose Zone Depth: ${activeMatch.site.depthToWaterTableM.toFixed(1)}m bgl (Safe unsaturated buffer)

Notice: Screening-level recommendation based on 30m DEM and open municipal datasets. Final execution requires topographical level survey and double-ring infiltrometer testing.`;

    navigator.clipboard.writeText(memoText);
    setMemoCopied(true);
    setTimeout(() => setMemoCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-3.5 sm:p-5 overflow-hidden font-sans justify-between">
      {/* 1. Top Header with Underpass Illustration Thumbnail, Badges, Title & Score */}
      <div>
        <div className="flex items-start justify-between gap-2.5 sm:gap-3.5">
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
            {/* Architectural Underpass / Flooded Corridor Thumbnail */}
            <div className="w-[82px] h-[58px] sm:w-[114px] sm:h-[72px] rounded-lg overflow-hidden border border-[#DCD6C6] shrink-0 bg-[#D9E2EC] relative">
              <svg viewBox="0 0 120 76" className="w-full h-full">
                {/* Sky & Foliage */}
                <rect width="120" height="45" fill="#DCE6EF" />
                <circle cx="98" cy="22" r="14" fill="#4E6636" />
                <circle cx="110" cy="25" r="12" fill="#3B5128" />
                {/* Flyover Bridge Deck & Pillars */}
                <polygon points="0,8 105,24 105,32 0,22" fill="#C4B9A5" />
                <polygon points="0,20 105,31 105,35 0,26" fill="#8C8270" />
                <rect x="14" y="24" width="12" height="24" fill="#9E9482" />
                <rect x="46" y="27" width="10" height="21" fill="#8D8372" />
                <rect x="74" y="30" width="8" height="18" fill="#7D7363" />
                <rect x="28" y="26" width="16" height="20" fill="#2A343D" />
                <rect x="58" y="29" width="14" height="17" fill="#2A343D" />
                {/* Pooled Monsoon Water in Underpass */}
                <rect x="0" y="45" width="120" height="31" fill="#4A779D" />
                <path d="M 0 50 Q 30 47 60 50 T 120 50 L 120 76 L 0 76 Z" fill="#335C81" fillOpacity="0.7" />
                <line x1="8" y1="54" x2="42" y2="54" stroke="#B8D4EC" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="52" y1="61" x2="96" y2="61" stroke="#B8D4EC" strokeWidth="1" strokeOpacity="0.6" />
                <line x1="18" y1="68" x2="72" y2="68" stroke="#B8D4EC" strokeWidth="1" strokeOpacity="0.5" />
              </svg>
            </div>

            <div className="min-w-0">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="px-2 py-0.5 bg-[#ECE8DC] text-[#0F2D59] rounded text-[10px] sm:text-[10.5px] font-mono font-bold uppercase">
                  {hotspot.id.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-[#43532B] text-[#FAF8F3] rounded text-[10px] sm:text-[10.5px] font-semibold">
                  {confidenceBadgeLabel[hotspot.confidence]}
                </span>
                <button
                  onClick={onOpenReportModal}
                  className="px-2 py-0.5 bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#DCD6C6] text-[#1B3A6B] rounded text-[10px] sm:text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3 h-3 text-[#43532B]" />
                  <span>Citizen Reports ({hotspot.reportCount})</span>
                </button>
              </div>

              {/* Hotspot Title & Location */}
              <h2 className="font-serif text-base sm:text-[20px] font-bold text-[#0F2D59] tracking-tight leading-snug mt-1 sm:mt-1.5">
                {hotspot.name}
              </h2>
              <p className="text-[11px] sm:text-[11.5px] text-[#4A6588] mt-0.5">{hotspot.locationName}</p>
            </div>
          </div>

          {/* Right Side Icons & Score */}
          <div className="flex flex-col items-end justify-between shrink-0">
            <div className="flex items-center gap-1 text-[#4A6588]">
              {isBookmarked && (
                <span className="text-[10px] font-semibold text-[#43532B] bg-[#EAEDE2] px-1.5 py-0.5 rounded">
                  Saved
                </span>
              )}
              {memoCopied && (
                <span className="text-[10px] font-semibold text-[#FAF8F3] bg-[#43532B] px-1.5 py-0.5 rounded">
                  Copied!
                </span>
              )}
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-1 rounded hover:bg-[#EFECE1] transition-colors cursor-pointer ${
                  isBookmarked ? 'text-[#43532B]' : 'text-[#4A6588]'
                }`}
                title="Bookmark Hotspot"
              >
                <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? '#43532B' : 'none'} />
              </button>
              <button
                onClick={handleCopyMemo}
                className="p-1 rounded hover:bg-[#EFECE1] text-[#4A6588] hover:text-[#0F2D59] transition-colors cursor-pointer"
                title="Copy Siting Summary to Clipboard"
              >
                {memoCopied ? <Check className="w-3.5 h-3.5 text-[#43532B]" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setSubTab('overview');
                  onSelectMatchRank?.(1);
                  onSelectSite(null);
                }}
                className="p-1 rounded hover:bg-[#EFECE1] text-[#4A6588] hover:text-[#0F2D59] transition-colors cursor-pointer"
                title="Reset Inspector & Map Focus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeMatch && (
              <div className="text-right mt-2">
                <span className="text-[10px] sm:text-[10.5px] text-[#5A718E] block">Score</span>
                <div className="font-sans">
                  <span className="text-base sm:text-lg font-extrabold text-[#0F2D59]">
                    {activeMatch.scoreBreakdown.totalWeightedScore}
                  </span>
                  <span className="text-xs text-[#5A718E] font-medium">/100</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Sub-Navigation Tabs (Overview, Hydrology, Design, Reports, Nearby Sites) */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[#E4DFD2] mt-3.5 text-xs font-medium overflow-x-auto whitespace-nowrap">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'hydrology', label: 'Hydrology' },
            { id: 'design', label: 'Design' },
            { id: 'reports', label: 'Reports' },
            { id: 'nearby', label: 'Nearby Sites' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`pb-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
                subTab === t.id
                  ? 'border-[#163B6E] text-[#0F2D59] font-bold'
                  : 'border-transparent text-[#5A718E] hover:text-[#0F2D59]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tab Body */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {subTab === 'overview' && activeMatch && (
          <>
            {/* Key Metrics Section */}
            <div>
              <h3 className="text-xs font-bold text-[#0F2D59] mb-2">Key Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Elevation Box */}
                <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 28 28" fill="none">
                    <path d="M3 22L11 10L16 17L20 12L25 22H3Z" fill="#163B6E" />
                  </svg>
                  <div>
                    <div className="text-sm font-extrabold text-[#0F2D59] leading-tight">
                      {hotspot.elevation.toFixed(1)} m
                    </div>
                    <div className="text-[10.5px] text-[#5A718E]">Elevation (MSL)</div>
                  </div>
                </div>

                {/* Computed Storm Runoff Box */}
                <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M3 11C6 8 9 14 12 11C15 8 18 14 21 11C23 9 24 10 25 11M3 16C6 13 9 19 12 16C15 13 18 19 21 16C23 14 24 15 25 16M3 21C6 18 9 24 12 21C15 18 18 24 21 21"
                      stroke="#2B6CB0"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-extrabold text-[#0F2D59] leading-tight">
                      {runoffVolumeM3.base.toLocaleString()} m³
                    </div>
                    <div className="text-[10px] text-[#5A718E] leading-tight">
                      Computed storm runoff ({runoffVolumeM3.low.toLocaleString()} - {runoffVolumeM3.high.toLocaleString()})
                    </div>
                  </div>
                </div>

                {/* Unabsorbed Volume Box */}
                <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M14 4C14 4 6 13.2 6 18.5C6 22.6 9.6 26 14 26C18.4 26 22 22.6 22 18.5C22 13.2 14 4 14 4Z"
                      fill="#43532B"
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-extrabold text-[#0F2D59] leading-tight">
                      {absorptionGapM3.base.toLocaleString()} m³
                    </div>
                    <div className="text-[10px] text-[#5A718E] leading-tight">
                      Unabsorbed volume ({100 - absorptionPercentage}% gap)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Siting Justification Callout */}
            <div className="bg-[#F2F5EC] border-l-[3.5px] border-[#43532B] rounded-r-xl px-3.5 py-2.5 flex items-start gap-2.5">
              <Leaf className="w-4 h-4 text-[#43532B] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#0F2D59] block">Siting Justification</span>
                <p className="text-[#2C4566] leading-relaxed mt-0.5 text-[11.5px]">
                  Downhill by {activeMatch.elevationDropM.toFixed(1)}m over {activeMatch.flowPathDistanceM}m flow path. Favorable{' '}
                  {activeMatch.site.soilClass.replace('_', ' ')} soil (base {activeMatch.site.infiltrationRateMmHr.base} mm/h) with{' '}
                  {activeMatch.site.depthToWaterTableM.toFixed(1)}m unsaturated vadose zone.
                </p>
              </div>
            </div>

            {/* Design Proposal Card */}
            <div>
              <h3 className="text-xs font-bold text-[#0F2D59] mb-2">Design Proposal</h3>
              <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-3.5 space-y-3">
                {/* Top Header Row with Cross-Section Diagram */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#EAEDE2] flex items-center justify-center shrink-0 mt-0.5">
                      <Trees className="w-5 h-5 text-[#43532B]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F2D59]">
                        {activeMatch.suggestedStructure.typeName}
                      </h4>
                      <p className="text-[11px] text-[#4A6588] leading-snug mt-0.5">
                        {activeMatch.suggestedStructure.description}
                      </p>
                    </div>
                  </div>

                  {/* Trench Cross-Section Engineering Diagram */}
                  <div className="w-full sm:w-[114px] h-[64px] rounded-lg border border-[#DCD6C6] overflow-hidden shrink-0 bg-[#F4EFE4]">
                    <svg viewBox="0 0 120 68" className="w-full h-full">
                      {/* Sky */}
                      <rect width="120" height="22" fill="#EBF2F7" />
                      {/* Trees on Surface */}
                      <circle cx="24" cy="12" r="7" fill="#5D753E" />
                      <rect x="23" y="16" width="2" height="6" fill="#6E5239" />
                      <circle cx="58" cy="10" r="8" fill="#4A6130" />
                      <rect x="57" y="15" width="2" height="7" fill="#6E5239" />
                      <circle cx="94" cy="12" r="7" fill="#5D753E" />
                      <rect x="93" y="16" width="2" height="6" fill="#6E5239" />
                      {/* Grass Surface Line */}
                      <rect x="0" y="21" width="120" height="3" fill="#6B8346" />
                      {/* Soil Strata (Sandy Loam) */}
                      <rect x="0" y="24" width="120" height="44" fill="#D5B895" />
                      <path d="M 0 42 Q 60 45 120 41 L 120 68 L 0 68 Z" fill="#C4A37E" />
                      {/* Gravel Infiltration Trench Cutout */}
                      <polygon
                        points="35,24 85,24 78,56 42,56"
                        fill="#8C99A6"
                        stroke="#1E4477"
                        strokeWidth="1.2"
                        strokeDasharray="2,1"
                      />
                      {/* Blue Percolation Arrows */}
                      <line x1="50" y1="32" x2="50" y2="50" stroke="#1E60B8" strokeWidth="1.5" />
                      <line x1="60" y1="30" x2="60" y2="52" stroke="#1E60B8" strokeWidth="1.5" />
                      <line x1="70" y1="32" x2="70" y2="50" stroke="#1E60B8" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {/* Row 1 */}
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">Dimensions</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.suggestedStructure.lengthM}m x {activeMatch.suggestedStructure.widthM}m x{' '}
                      {activeMatch.suggestedStructure.depthM}m
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">Void Ratio</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.suggestedStructure.voidRatio}
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">Floor Area</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.suggestedStructure.infiltratingAreaM2} m²
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#2B5B94] font-medium block">Flood Relief (Captured)</span>
                    <span className="font-extrabold text-[#0F2D59] text-sm mt-0.5 block">
                      {activeMatch.capturedPerStormM3.base.toLocaleString()} m³
                    </span>
                    <span className="text-[9.5px] text-[#5A718E] block">
                      Range: {activeMatch.capturedPerStormM3.low} - {activeMatch.capturedPerStormM3.high} m³
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#2B5B94] font-medium block">Groundwater Recharge</span>
                    <span className="font-extrabold text-[#0F2D59] text-sm mt-0.5 block">
                      {activeMatch.rechargePerStormM3.base.toLocaleString()} m³
                    </span>
                    <span className="text-[9.5px] text-[#5A718E] block">
                      Range: {activeMatch.rechargePerStormM3.low} - {activeMatch.rechargePerStormM3.high} m³
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#2B5B94] font-medium block">Annual Recharge (PRD)</span>
                    <span className="font-extrabold text-[#0F2D59] text-sm mt-0.5 block">
                      {(activeMatch.annualRechargePotentialM3?.base ?? activeMatch.rechargePerStormM3.base * 12).toLocaleString()} m³/yr
                    </span>
                    <span className="text-[9.5px] text-[#5A718E] block">(~12 storms)</span>
                  </div>

                  {/* Row 3 */}
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">Physical Tank Volume (V_store)</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.storageVolumeM3} m³
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">48h Infiltration Limit (V_drain)</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.drainLimitedVolumeM3.base} m³{' '}
                      <span className="font-normal text-[10px] text-[#5A718E]">
                        [{activeMatch.drainLimitedVolumeM3.low} - {activeMatch.drainLimitedVolumeM3.high}]
                      </span>
                    </span>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E8E3D5] rounded-lg px-2.5 py-2">
                    <span className="text-[10px] text-[#5A718E] block">Design Capacity</span>
                    <span className="font-bold text-[#0F2D59] text-xs mt-0.5 block">
                      {activeMatch.designCapacityM3.base} m³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Silt & Vadose Footnotes */}
            <div className="space-y-1 text-[11px] text-[#2C4566] pt-0.5">
              <div>
                <strong className="text-[#0F2D59]">Silt & First-Flush Gate:</strong> Mandatory 2-chamber desilting interceptor included.
              </div>
              <div>
                <strong className="text-[#0F2D59]">Vadose Buffer:</strong>{' '}
                {activeMatch.site.depthToWaterTableM.toFixed(1)}m depth to water table (safe unsaturated zone).
              </div>
            </div>
          </>
        )}

        {/* Sub-Tab: Hydrology */}
        {subTab === 'hydrology' && (
          <div className="space-y-3 text-xs pt-1">
            <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 space-y-3">
              <h4 className="font-serif text-sm font-bold text-[#0F2D59]">
                Upstream Catchment Parameters ({hotspot.id.toUpperCase()})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F4F1E8] rounded-lg">
                  <span className="text-[10px] text-[#5A718E] block">Catchment Area (A)</span>
                  <span className="text-sm font-bold text-[#0F2D59]">
                    {hotspot.catchmentAreaM2.toLocaleString()} m²
                  </span>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-lg">
                  <span className="text-[10px] text-[#5A718E] block">Weighted Runoff Coeff (C)</span>
                  <span className="text-sm font-bold text-[#0F2D59]">
                    {hotspot.weightedRunoffCoeff.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[#2C4566]">
                  <span>Paved Roads & Asphalt (C = 0.90)</span>
                  <span className="font-mono font-bold">{hotspot.landCover.pavedPercent}%</span>
                </div>
                <div className="flex justify-between text-[#2C4566]">
                  <span>Rooftops & Built Area (C = 0.85)</span>
                  <span className="font-mono font-bold">{hotspot.landCover.roofPercent}%</span>
                </div>
                <div className="flex justify-between text-[#2C4566]">
                  <span>Pervious Green Cover (C = 0.25)</span>
                  <span className="font-mono font-bold">{hotspot.landCover.greenPercent}%</span>
                </div>
              </div>
              <button
                onClick={onOpenAssumptionsModal}
                className="w-full py-2 px-3 bg-[#43532B] text-[#FAF8F3] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Open Full CGWB Hydrological Formulae
              </button>
            </div>
          </div>
        )}

        {/* Sub-Tab: Design */}
        {subTab === 'design' && activeMatch && (
          <div className="space-y-3 text-xs pt-1">
            <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 space-y-2.5">
              <h4 className="font-serif text-sm font-bold text-[#0F2D59]">
                {activeMatch.suggestedStructure.typeName}
              </h4>
              <p className="text-[#2C4566] leading-relaxed">{activeMatch.suggestedStructure.description}</p>
              <div className="border-t border-[#E4DFD2] pt-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5A718E]">Target Sink:</span>
                  <span className="font-bold text-[#0F2D59]">{activeMatch.site.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A718E]">Ownership:</span>
                  <span className="font-bold text-[#0F2D59]">{activeMatch.site.ownershipName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A718E]">Soil Class:</span>
                  <span className="font-bold text-[#0F2D59] capitalize">
                    {activeMatch.site.soilClass.replace('_', ' ')} ({activeMatch.site.infiltrationRateMmHr.base} mm/h)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A718E]">Water Table Depth:</span>
                  <span className="font-bold text-[#0F2D59]">{activeMatch.site.depthToWaterTableM} m BGL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab: Reports */}
        {subTab === 'reports' && (
          <div className="space-y-3 text-xs pt-1">
            <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-[#0F2D59]">
                  Field Verification & Citizen Reports ({hotspot.reportCount})
                </h4>
                <button
                  onClick={onOpenReportModal}
                  className="px-3 py-1 bg-[#43532B] text-[#FAF8F3] rounded-lg text-[11px] font-semibold cursor-pointer"
                >
                  + Add Report
                </button>
              </div>
              <p className="text-[#2C4566] leading-relaxed">{hotspot.historicalNotes}</p>
              <div className="text-[11px] text-[#5A718E] font-mono pt-1 border-t border-[#E4DFD2]">
                Typical Depth: {hotspot.typicalDepth.replace(/_/g, ' ')} · Duration: {hotspot.typicalDuration.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab: Nearby Sites */}
        {subTab === 'nearby' && (
          <div className="space-y-2 text-xs pt-1">
            {topMatches.map((m) => (
              <div
                key={m.site.id}
                onClick={() => {
                  onSelectMatchRank?.(m.rank);
                  onSelectSite(m.site);
                  setSubTab('overview');
                }}
                className="p-3 bg-[#FAF8F3] hover:bg-[#F2EFE4] border border-[#E4DFD2] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-bold text-[#0F2D59] block">
                    #{m.rank} · {m.site.name}
                  </span>
                  <span className="text-[11px] text-[#5A718E]">
                    ↓ {m.elevationDropM.toFixed(1)}m drop · {m.flowPathDistanceM}m path
                  </span>
                </div>
                <span className="font-mono font-bold text-[#0F2D59]">
                  {m.scoreBreakdown.totalWeightedScore}/100
                </span>
              </div>
            ))}
            <div className="text-[11px] text-[#5A718E] pt-1">
              {rejectedSites.length} uphill or flood-exposed candidate sites automatically excluded by physical constraints.
            </div>
          </div>
        )}
      </div>

      {activeMatch && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E3D5]">
          <button
            onClick={() => {
              onSelectSite(activeMatch.site);
              setFocusedOnMap(true);
              setTimeout(() => setFocusedOnMap(false), 1600);
            }}
            className="py-2.5 px-4 text-xs font-semibold text-[#FAF8F3] bg-[#163B6E] hover:bg-[#0F2D59] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
          >
            {focusedOnMap ? (
              <>
                <Check className="w-4 h-4 text-[#FAF8F3]" />
                <span>Focused on Map</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4 text-[#FAF8F3]" />
                <span>Focus on Map</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsMemoOpen(true)}
            className="py-2.5 px-4 text-xs font-semibold text-[#0F2D59] bg-[#FAF8F3] hover:bg-[#EFECE1] border border-[#7E95B4] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
          >
            <FileText className="w-4 h-4 text-[#0F2D59]" />
            <span>Siting Memo</span>
          </button>
        </div>
      )}

      {/* Siting Feasibility Memorandum Modal */}
      {isMemoOpen && activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2D59]/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DCD6C6] rounded-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
            <div className="p-4 border-b border-[#E4DFD2] bg-[#F3EFE6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#43532B] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#FAF8F3]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0F2D59]">
                    Civil Engineering Siting Brief Memorandum
                  </h3>
                  <p className="text-[11px] text-[#4A6588]">
                    Official screening-level brief ready for MCD / DJB Drainage Cell review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMemoOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#43532B] hover:bg-[#364422] text-[#FAF8F3] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#FAF8F3]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-[#E4DFD2] text-xs font-mono text-[#0F2D59] bg-[#FAF8F3] leading-relaxed">
              <div className="pb-4 space-y-1">
                <div className="text-[11px] text-[#4A6588]">TO: Delhi Jal Board (Drainage Division) & MCD Central Zone</div>
                <div className="text-[11px] text-[#4A6588]">FROM: RechargeMatch Ward 142 Hydrological Siting Engine</div>
                <div className="font-bold text-[#0F2D59] pt-1">
                  SUBJECT: Overland Runoff Infiltration Siting - {hotspot.name}
                </div>
              </div>

              <div className="py-4 space-y-1">
                <span className="font-bold text-[#0F2D59] block font-sans">1. HYDROLOGICAL FLOOD ORIGIN</span>
                <p className="text-[#2C4566]">
                  Location: {hotspot.name} ({hotspot.locationName})
                  <br />Benchmark Elevation: {hotspot.elevation.toFixed(1)}m MSL
                  <br />Catchment Impermeable Area: {hotspot.catchmentAreaM2.toLocaleString()} m² (Runoff C={hotspot.weightedRunoffCoeff})
                  <br />Computed Overland Runoff: {runoffVolumeM3.base.toLocaleString()} m³
                </p>
              </div>

              <div className="py-4 space-y-1">
                <span className="font-bold text-[#0F2D59] block font-sans">2. SITED DOWNHILL CAPTURE SINK</span>
                <p className="text-[#2C4566]">
                  Target Site: {activeMatch.site.name} ({activeMatch.site.ownershipName})
                  <br />Terrain Gradient: ↓ {activeMatch.elevationDropM.toFixed(1)}m natural gravity drop ({activeMatch.flowPathDistanceM}m flow path)
                  <br />Proposed Structure: {activeMatch.suggestedStructure.typeName}
                  <br />Structure Dimensions: {activeMatch.suggestedStructure.lengthM}m x {activeMatch.suggestedStructure.widthM}m x {activeMatch.suggestedStructure.depthM}m
                </p>
              </div>

              <div className="py-4 space-y-1">
                <span className="font-bold text-[#0F2D59] block font-sans">3. SIZING & CAPACITY NUMBERS</span>
                <p className="text-[#2C4566]">
                  Storage Volume (V_store): {activeMatch.storageVolumeM3} m³
                  <br />48h Soil Soak Limit (V_drain): {activeMatch.drainLimitedVolumeM3.base} m³
                  <br />Storm Design Capture (V_design): {activeMatch.capturedPerStormM3.base} m³
                  <br />Estimated Annual Recharge: ~{(activeMatch.annualRechargePotentialM3?.base ?? activeMatch.rechargePerStormM3.base * 12).toLocaleString()} m³/year
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#E4DFD2] bg-[#F3EFE6] flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[11px] text-[#4A6588]">
                Compliant with CGWB & CPWD urban drainage screening codes
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMemo}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F3] bg-[#43532B] hover:bg-[#364422] rounded-lg transition-colors cursor-pointer"
                >
                  {memoCopied ? <Check className="w-3.5 h-3.5 text-[#FAF8F3]" /> : <Copy className="w-3.5 h-3.5 text-[#FAF8F3]" />}
                  <span>{memoCopied ? 'Copied to Clipboard' : 'Copy Memorandum'}</span>
                </button>
                <button
                  onClick={() => setIsMemoOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0F2D59] bg-[#FAF8F3] border border-[#DCD6C6] rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
