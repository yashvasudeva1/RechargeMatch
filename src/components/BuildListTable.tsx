import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  Info,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ListFilter,
  X,
  Check,
  Copy,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { HotspotMatchResult, StormEvent, ScoringWeights } from '../types/hydrology';

interface BuildListTableProps {
  results: Record<string, HotspotMatchResult>;
  wardSummary: {
    totalRunoffM3: { low: number; base: number; high: number };
    totalCapturedM3: { low: number; base: number; high: number };
    totalRechargedM3: { low: number; base: number; high: number };
    totalAnnualRechargeM3?: { low: number; base: number; high: number };
    wardAbsorptionGapM3: { low: number; base: number; high: number };
    absorptionPercentage: number;
    recommendedStructuresCount: number;
    detentionOnlyStructuresCount: number;
    rejectedUphillCount: number;
  };
  activeStorm: StormEvent;
  weights: ScoringWeights;
  onSelectHotspotById: (id: string) => void;
  onInspectStructure?: (hotspotId: string, siteId: string, rank: number) => void;
  onOpenAssumptionsModal?: () => void;
  onOpenWeightsModal?: () => void;
  onSwitchToMap?: () => void;
}

interface FlattenedBuildItem {
  id: string;
  rank: number;
  hotspotId: string;
  hotspotName: string;
  hotspotLocation: string;
  hotspotElevation: number;
  siteId: string;
  siteName: string;
  siteType: string;
  ownership: string;
  areaHa: string;
  siteElevation: number;
  elevationDropM: number;
  flowDistanceM: number;
  structureTypeName: string;
  dimensions: string;
  storageM3: number;
  capturedM3: { low: number; base: number; high: number };
  rechargeM3: { low: number; base: number; high: number };
  annualRechargeM3: { low: number; base: number; high: number };
  status: 'recommended' | 'detention_only';
  score: number;
  priorityLevel: 'High' | 'Medium' | 'Low';
  justification: string;
}

export const BuildListTable: React.FC<BuildListTableProps> = ({
  results,
  wardSummary,
  onSelectHotspotById,
  onInspectStructure,
  onOpenAssumptionsModal,
  onOpenWeightsModal,
  onSwitchToMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recommended' | 'detention_only'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'annual' | 'score' | 'elevation' | 'distance'>('impact');
  const [showAllRows, setShowAllRows] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySpecs = (item: FlattenedBuildItem) => {
    const specText = `${item.siteName} (${item.ownership}) - ${item.structureTypeName} [${item.dimensions}] | Hotspot: ${item.hotspotName} | Drop: ${item.elevationDropM.toFixed(1)}m | Path: ${item.flowDistanceM}m | Flood Relief: ${item.capturedM3.base} m³ | Annual Yield: ${item.annualRechargeM3.base} m³/yr`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(specText).catch(() => {});
    }
    setCopiedId(item.id);
    setOpenMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allItems: FlattenedBuildItem[] = useMemo(() => {
    const list: FlattenedBuildItem[] = [];

    for (const hsId in results) {
      const res = results[hsId];
      for (const m of res.topMatches) {
        let priorityLevel: 'High' | 'Medium' | 'Low' = 'Medium';
        if (m.capturedPerStormM3.base >= 450 || m.scoreBreakdown.totalWeightedScore >= 82) {
          priorityLevel = 'High';
        } else if (m.capturedPerStormM3.base < 200 && m.scoreBreakdown.totalWeightedScore < 72) {
          priorityLevel = 'Low';
        }

        const annualRecharge = m.annualRechargePotentialM3 || {
          low: m.rechargePerStormM3.low * 10,
          base: m.rechargePerStormM3.base * 12,
          high: m.rechargePerStormM3.high * 14,
        };

        const isShaft = m.suggestedStructure.typeName.toLowerCase().includes('shaft');
        const dimString = isShaft
          ? `Ø ${m.suggestedStructure.widthM} m x ${m.suggestedStructure.depthM.toFixed(1)} m`
          : `${m.suggestedStructure.lengthM} x ${m.suggestedStructure.widthM} x ${m.suggestedStructure.depthM} m`;

        list.push({
          id: `${res.hotspot.id}-${m.site.id}`,
          rank: m.rank,
          hotspotId: res.hotspot.id,
          hotspotName: res.hotspot.name,
          hotspotLocation: res.hotspot.locationName,
          hotspotElevation: res.hotspot.elevation,
          siteId: m.site.id,
          siteName: m.site.name,
          siteType:
            m.site.type === 'public_park'
              ? 'Public Park'
              : m.site.type === 'institutional'
              ? 'Institutional'
              : 'Municipal Ground',
          ownership: m.site.ownershipName,
          areaHa: (m.site.totalAreaM2 / 10000).toFixed(1),
          siteElevation: m.site.elevation,
          elevationDropM: m.elevationDropM,
          flowDistanceM: m.flowPathDistanceM,
          structureTypeName: m.suggestedStructure.typeName,
          dimensions: dimString,
          storageM3: m.storageVolumeM3,
          capturedM3: m.capturedPerStormM3,
          rechargeM3: m.rechargePerStormM3,
          annualRechargeM3: annualRecharge,
          status: m.status,
          score: m.scoreBreakdown.totalWeightedScore,
          priorityLevel,
          justification: m.plainLanguageReason,
        });
      }
    }

    list.sort((a, b) => {
      if (sortBy === 'impact') return b.capturedM3.base - a.capturedM3.base;
      if (sortBy === 'annual') return b.annualRechargeM3.base - a.annualRechargeM3.base;
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'elevation') return b.elevationDropM - a.elevationDropM;
      if (sortBy === 'distance') return a.flowDistanceM - b.flowDistanceM;
      return 0;
    });

    return list;
  }, [results, sortBy]);

  const recommendedCount = useMemo(
    () => allItems.filter((i) => i.status === 'recommended').length,
    [allItems]
  );
  const detentionCount = useMemo(
    () => allItems.filter((i) => i.status === 'detention_only').length,
    [allItems]
  );

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.siteName.toLowerCase().includes(q) ||
        item.hotspotName.toLowerCase().includes(q) ||
        item.hotspotLocation.toLowerCase().includes(q) ||
        item.structureTypeName.toLowerCase().includes(q) ||
        item.ownership.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priorityLevel === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [allItems, searchTerm, statusFilter, priorityFilter]);

  const displayedItems = useMemo(() => {
    return showAllRows ? filteredItems : filteredItems.slice(0, 10);
  }, [filteredItems, showAllRows]);

  const remainingCount = Math.max(0, filteredItems.length - displayedItems.length);

  const totalAnnualYieldBase = useMemo(() => {
    return allItems.reduce((acc, it) => acc + (it.status === 'recommended' ? it.annualRechargeM3.base : 0), 0);
  }, [allItems]);

  const maxCapturedM3 = useMemo(() => {
    return Math.max(600, ...allItems.map((i) => i.capturedM3.base));
  }, [allItems]);

  return (
    <div className="space-y-5 font-sans pb-6">
      {/* 1. Hero Header Section with Right-Side Delhi Skyline & Botanical Illustration */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FAF8F3] via-[#FAF8F3] to-[#EEF3E8] border border-[#E4DFD2] px-6 py-6 sm:px-8 sm:py-7">
        {/* Right-Side Architectural Skyline & Park Foliage Artwork */}
        <svg
          className="hidden lg:block absolute right-0 top-0 bottom-0 h-full w-[480px] pointer-events-none"
          viewBox="0 0 480 180"
          preserveAspectRatio="xMaxYMid slice"
        >
          <defs>
            <linearGradient id="ledger-sky-fade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FAF8F3" stopOpacity="1" />
              <stop offset="28%" stopColor="#FAF8F3" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Soft Blue Clouds & Horizon */}
          <path
            d="M 80 140 Q 190 95 310 120 T 480 105 L 480 180 L 80 180 Z"
            fill="#DCE8F2"
            fillOpacity="0.6"
          />

          {/* Delhi Skyline Silhouette (Qutub Minar, India Gate & Heritage Domes) */}
          <g fill="#B0C4D8" fillOpacity="0.65">
            <rect x="145" y="102" width="22" height="55" />
            <rect x="172" y="92" width="28" height="65" />
            <rect x="206" y="108" width="18" height="49" />
            {/* Qutub Minar Tower Silhouette */}
            <polygon points="244,24 254,24 260,150 238,150" fill="#9CB5CD" />
            <rect x="242" y="48" width="14" height="3" fill="#7F9BB8" />
            <rect x="240" y="76" width="18" height="3" fill="#7F9BB8" />
            <rect x="239" y="104" width="20" height="3" fill="#7F9BB8" />
            {/* Heritage Dome & India Gate */}
            <path d="M 285 110 Q 302 84 319 110 L 319 155 L 285 155 Z" />
            <g transform="translate(335, 86)" fill="#A4BBD1">
              <rect x="4" y="0" width="42" height="6" />
              <rect x="0" y="6" width="50" height="64" />
              <path d="M 15 70 L 15 32 A 10 10 0 0 1 35 32 L 35 70 Z" fill="#EDF3F8" />
            </g>
          </g>

          {/* Rolling Green Park Meadow */}
          <path
            d="M 110 162 Q 250 132 480 145 L 480 180 L 110 180 Z"
            fill="#C5D4AE"
            fillOpacity="0.75"
          />
          <path
            d="M 180 172 Q 330 146 480 156 L 480 180 L 180 180 Z"
            fill="#9EB480"
            fillOpacity="0.7"
          />

          {/* Botanical Trees on Right */}
          <g>
            <circle cx="222" cy="134" r="16" fill="#6E8649" />
            <circle cx="282" cy="138" r="14" fill="#5B733B" />
            <circle cx="405" cy="112" r="26" fill="#597238" />
            <circle cx="435" cy="96" r="32" fill="#435929" />
            <circle cx="465" cy="108" r="28" fill="#364920" />
            <circle cx="422" cy="124" r="22" fill="#6A8347" />
          </g>

          {/* Left Fade Mask */}
          <rect width="160" height="180" fill="url(#ledger-sky-fade)" />
        </svg>

        {/* Left Editorial Title & Subtitle */}
        <div className="relative z-10 max-w-2xl">
          <div className="text-[11px] font-sans uppercase tracking-[0.16em] text-[#4A6588] font-semibold">
            SOUTH DELHI WARD 142 &nbsp;·&nbsp; PRE-MONSOON PLANNING
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0F2D59] tracking-tight mt-1 leading-tight">
            Pre-Monsoon Recharge Structure Priority Ledger
          </h1>
          <p className="text-xs sm:text-[13.5px] text-[#3B5474] mt-2 leading-relaxed">
            Recommended recharge structures and detention basins based on hydrological analysis, terrain data and ground conditions.{' '}
            <strong className="text-[#0F2D59]">{wardSummary.absorptionPercentage}%</strong> of storm runoff (
            {wardSummary.totalRunoffM3.base.toLocaleString()} m³) can be locally captured through{' '}
            <strong className="text-[#0F2D59]">{allItems.length}</strong> high-priority interventions.
          </p>
        </div>
      </div>

      {/* 2. Five KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Storm Runoff */}
        <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 flex items-center gap-3.5">
          <svg className="w-9 h-9 shrink-0" viewBox="0 0 36 36" fill="none">
            <path
              d="M11 22H25.5C28.5 22 31 19.5 31 16.5C31 13.7 28.9 11.4 26.2 11.1C25.1 6.5 21 3 16 3C10.5 3 6 7.5 6 13C6 13.5 6.1 14 6.2 14.5C4.3 15.4 3 17.3 3 19.5C3 22 5 22 7.5 22H11Z"
              fill="#8ABCE6"
            />
            <circle cx="12" cy="27" r="1.5" fill="#2B6CB0" />
            <circle cx="18" cy="29" r="1.5" fill="#2B6CB0" />
            <circle cx="24" cy="27" r="1.5" fill="#2B6CB0" />
          </svg>
          <div>
            <span className="text-[11px] text-[#5A718E] block">Storm Runoff (Annual)</span>
            <span className="text-xl font-extrabold text-[#0F2D59] block leading-tight mt-0.5">
              {wardSummary.totalRunoffM3.base.toLocaleString()} m³
            </span>
            <span className="text-[11px] text-[#5A718E] block mt-0.5">
              Across {Object.keys(results).length} hotspots
            </span>
          </div>
        </div>

        {/* Card 2: Flood Relief */}
        <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 flex items-center gap-3.5">
          <svg className="w-9 h-9 shrink-0" viewBox="0 0 36 36" fill="none">
            <path
              d="M4 14C8 10 12 18 16 14C20 10 24 18 28 14C30 12 31 13 32 14M4 20C8 16 12 24 16 20C20 16 24 24 28 20C30 18 31 19 32 20M4 26C8 22 12 30 16 26C20 22 24 30 28 26"
              stroke="#2B7AC4"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <span className="text-[11px] text-[#5A718E] block">Flood Relief (Capturable)</span>
            <span className="text-xl font-extrabold text-[#0F2D59] block leading-tight mt-0.5">
              {wardSummary.totalCapturedM3.base.toLocaleString()} m³
            </span>
            <span className="text-[11px] text-[#5A718E] block mt-0.5">
              {wardSummary.recommendedStructuresCount} verified downhill sites
            </span>
          </div>
        </div>

        {/* Card 3: Storm Infiltration */}
        <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 flex items-center gap-3.5">
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 4C16 4 7 14.5 7 20.5C7 25.5 11 29.5 16 29.5C21 29.5 25 25.5 25 20.5C25 14.5 16 4 16 4Z"
              fill="#2266B2"
            />
          </svg>
          <div>
            <span className="text-[11px] text-[#5A718E] block">Storm Infiltration</span>
            <span className="text-xl font-extrabold text-[#0F2D59] block leading-tight mt-0.5">
              {wardSummary.totalRechargedM3.base.toLocaleString()} m³
            </span>
            <span className="text-[11px] text-[#5A718E] block mt-0.5">48h vadose percolation</span>
          </div>
        </div>

        {/* Card 4: Annual Yield */}
        <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 flex items-center gap-3.5">
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
            <path
              d="M26 6C15 6 7 13 7 23C7 25 8 27 8 27C8 27 10 28 12 28C22 28 26 17 26 6Z"
              fill="#4B6130"
            />
            <path d="M8 27C13 21 19 15 25 7" stroke="#FAF8F3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <span className="text-[11px] text-[#5A718E] block">Annual Yield (PRD §7)</span>
            <span className="text-xl font-extrabold text-[#0F2D59] block leading-tight mt-0.5">
              {totalAnnualYieldBase.toLocaleString()} m³/yr
            </span>
            <span className="text-[11px] text-[#5A718E] block mt-0.5">~12 qualifying monsoon storms</span>
          </div>
        </div>

        {/* Card 5: Absorption Gap */}
        <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-4 flex items-center gap-3.5">
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="21" width="4.5" height="9" rx="1" fill="#5A6E3E" />
            <rect x="13" y="16" width="4.5" height="14" rx="1" fill="#43532B" />
            <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#43532B" />
            <path
              d="M28 24V9M28 9L24.5 12.5M28 9L31.5 12.5"
              stroke="#43532B"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <span className="text-[11px] text-[#5A718E] block">Absorption Gap</span>
            <span className="text-xl font-extrabold text-[#0F2D59] block leading-tight mt-0.5">
              {wardSummary.wardAbsorptionGapM3.base.toLocaleString()} m³
            </span>
            <span className="text-[11px] text-[#5A718E] block mt-0.5">
              {100 - wardSummary.absorptionPercentage}% unabsorbed residual
            </span>
          </div>
        </div>
      </div>

      {/* 3. Captured Progress & "Why this matters" Banner */}
      <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 4C12 4 6 9 6 17C6 18.5 7 20 7 20C7 20 8.5 21 10 21C18 21 20 12 20 4Z"
                fill="#43532B"
              />
            </svg>
            <span className="text-base font-extrabold text-[#0F2D59]">
              {wardSummary.absorptionPercentage}% Captured
            </span>
          </div>

          <div className="w-52 sm:w-64 h-3 bg-[#E6E2D6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4A5D32] rounded-full transition-all duration-300"
              style={{ width: `${wardSummary.absorptionPercentage}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-[#3B5474] leading-relaxed flex-1">
          <strong className="text-[#0F2D59]">Why this matters:</strong> With{' '}
          {wardSummary.recommendedStructuresCount} recommended recharge structures and{' '}
          {wardSummary.detentionOnlyStructuresCount} bio-detention basins,{' '}
          {wardSummary.wardAbsorptionGapM3.base.toLocaleString()} m³ of storm runoff exceeds natural local absorption capacity - justifying supplementary trunk drain desilting.
        </p>

        <button
          onClick={onSwitchToMap}
          className="px-4 py-2 rounded-lg bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#DCD6C6] text-xs font-semibold text-[#0F2D59] flex items-center gap-1.5 whitespace-nowrap self-start lg:self-auto cursor-pointer transition-colors"
        >
          <span>View Analysis</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#1E4477]" />
        </button>
      </div>

      {/* 4. Search, Filter Pills & Sort Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5A718E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search park, school, landmark, or hotspot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF8F3] border border-[#DCD6C6] rounded-xl text-[#0F2D59] placeholder-[#6E829C] focus:outline-none focus:border-[#43532B]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E829C] hover:text-[#0F2D59] cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
            {[
              { id: 'all', label: `All (${allItems.length})` },
              { id: 'recommended', label: `Recommended (${recommendedCount})` },
              { id: 'detention_only', label: `Detention Only (${detentionCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === st.id
                    ? 'bg-[#43532B] text-[#FAF8F3] font-semibold'
                    : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#DCD6C6] text-[#2C4566] font-medium'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Priority Dropdown, Sort Dropdown & Weights Filter Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="flex-1 sm:flex-initial bg-[#FAF8F3] border border-[#DCD6C6] rounded-lg px-3 py-2 text-xs font-medium text-[#0F2D59] focus:outline-none cursor-pointer"
          >
            <option value="all">Priority: All</option>
            <option value="High">Priority: High</option>
            <option value="Medium">Priority: Medium</option>
            <option value="Low">Priority: Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 sm:flex-initial bg-[#FAF8F3] border border-[#DCD6C6] rounded-lg px-3 py-2 text-xs font-medium text-[#0F2D59] focus:outline-none cursor-pointer"
          >
            <option value="impact">Sort: Max Flood Relief</option>
            <option value="annual">Sort: Max Annual Yield</option>
            <option value="score">Sort: Highest Match Score</option>
            <option value="elevation">Sort: Max Elevation Drop</option>
            <option value="distance">Sort: Shortest Flow Path</option>
          </select>

          <button
            onClick={onOpenWeightsModal}
            className="w-9 h-9 rounded-lg bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#DCD6C6] text-[#0F2D59] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Adjust Multi-Factor Scoring Weights"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F1E8] border-b border-[#E4DFD2] text-[#2C4566]">
              <tr>
                <th className="py-3.5 px-4 font-semibold w-12">#</th>
                <th className="py-3.5 px-4">
                  <div className="font-bold text-[#0F2D59]">Site & Location</div>
                  <div className="text-[10.5px] font-normal text-[#6E829C]">Type - Department - Area</div>
                </th>
                <th className="py-3.5 px-4 font-bold text-[#0F2D59]">Nearest Landmarks</th>
                <th className="py-3.5 px-4">
                  <div className="font-bold text-[#0F2D59]">Terrain & Flow</div>
                  <div className="text-[10.5px] font-normal text-[#6E829C]">Drop - Path length</div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="font-bold text-[#0F2D59]">Recommended Structure</div>
                  <div className="text-[10.5px] font-normal text-[#6E829C]">Type - Dimensions</div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="font-bold text-[#0F2D59]">Flood Relief</div>
                  <button
                    type="button"
                    onClick={onOpenAssumptionsModal}
                    title="View Flood Relief Formula: min(V_runoff, V_store)"
                    className="text-[10.5px] font-normal text-[#6E829C] hover:text-[#0F2D59] flex items-center gap-1 cursor-pointer"
                  >
                    <span>(m³)</span>
                    <Info className="w-3 h-3 text-[#7A8CA5]" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <div className="font-bold text-[#0F2D59]">Annual Yield</div>
                  <button
                    type="button"
                    onClick={onOpenAssumptionsModal}
                    title="View Annual Yield Formula (PRD §7 - 12 qualifying monsoon storms)"
                    className="text-[10.5px] font-normal text-[#6E829C] hover:text-[#0F2D59] flex items-center gap-1 cursor-pointer"
                  >
                    <span>(m³/yr)</span>
                    <Info className="w-3 h-3 text-[#7A8CA5]" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={onOpenWeightsModal}
                    title="View & Adjust Multi-Factor Priority Scoring"
                    className="font-bold text-[#0F2D59] hover:text-[#1E4477] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Priority</span>
                    <Info className="w-3 h-3 text-[#7A8CA5]" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-bold text-[#0F2D59]">Status</th>
                <th className="py-3.5 px-4 font-bold text-[#0F2D59] text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EBE6D9]">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#5A718E] text-xs">
                    No priority structures matched your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => {
                  const floodReliefPct = Math.min(100, Math.round((item.capturedM3.base / maxCapturedM3) * 100));
                  const handleInspectRow = () => {
                    if (onInspectStructure) {
                      onInspectStructure(item.hotspotId, item.siteId, item.rank);
                    } else {
                      onSelectHotspotById(item.hotspotId);
                    }
                  };

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F5F2E8]/70 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="w-7 h-7 rounded-md bg-[#43532B] text-[#FAF8F3] font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-4 px-4 max-w-[250px]">
                        <button
                          type="button"
                          onClick={handleInspectRow}
                          className="text-left font-bold text-[#0F2D59] hover:underline text-[13px] leading-snug cursor-pointer"
                        >
                          {item.siteName}
                        </button>
                        <div className="text-[11px] text-[#5A718E] mt-0.5 leading-snug">
                          {item.ownership.split(' (')[0]} - {item.siteType} - ~{item.areaHa} ha
                        </div>
                      </td>

                      {/* Nearest Landmarks / Origin Hotspot */}
                      <td className="py-4 px-4">
                        <button
                          onClick={handleInspectRow}
                          className="text-left text-[#2C4566] hover:text-[#0F2D59] hover:underline font-medium leading-snug cursor-pointer"
                        >
                          <div className="font-medium text-[#1B3A6B]">{item.hotspotName.split(' (')[0]}</div>
                          <div className="text-[11px] text-[#5A718E] mt-0.5 truncate max-w-[165px]">
                            {item.hotspotLocation}
                          </div>
                        </button>
                      </td>

                      {/* Terrain & Flow */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-[#0F2D59] text-xs">
                          ↓ {item.elevationDropM.toFixed(1)} m
                        </div>
                        <div className="text-[11px] text-[#5A718E] mt-0.5">{item.flowDistanceM} m</div>
                      </td>

                      {/* Recommended Structure */}
                      <td className="py-4 px-4 max-w-[210px]">
                        <div className="font-medium text-[#1B3A6B] leading-snug">
                          {item.structureTypeName}
                        </div>
                        <div className="text-[11px] text-[#5A718E] mt-0.5 font-mono">
                          {item.dimensions}
                        </div>
                      </td>

                      {/* Flood Relief (m³) + Mini Progress Bar */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-[#0F2D59] text-xs">
                          {item.capturedM3.base.toLocaleString()} m³
                        </div>
                        <div className="w-16 h-1.5 bg-[#E4DFD2] rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-[#2B6CB0] rounded-full"
                            style={{ width: `${floodReliefPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Annual Yield (m³/yr) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.annualRechargeM3.base > 0 ? (
                          <div>
                            <div className="font-extrabold text-[#0F2D59] text-xs">
                              {item.annualRechargeM3.base.toLocaleString()}
                            </div>
                            <div className="text-[10.5px] text-[#5A718E]">m³/yr</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[#6E829C] text-xs font-medium">0 m³/yr</div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8C98A8]" />
                              <span className="w-10 h-1 bg-[#E4DFD2] rounded-full" />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Priority Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${
                            item.priorityLevel === 'High'
                              ? 'bg-[#F6E4DC] text-[#9C3D26]'
                              : item.priorityLevel === 'Medium'
                              ? 'bg-[#F4EBDC] text-[#7D5B22]'
                              : 'bg-[#EAEDE2] text-[#43532B]'
                          }`}
                        >
                          {item.priorityLevel}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.status === 'recommended' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#E2ECD6] text-[#354B1D] border border-[#BDD1A6]">
                            RECOMMENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EBF1F6] text-[#1E4477] border border-[#B8CCE0]">
                            DETENTION
                          </span>
                        )}
                      </td>

                      {/* Action Column: Inspect Button + Interactive 3-Dots Menu */}
                      <td className="py-4 px-4 whitespace-nowrap text-right relative">
                        <div className="inline-flex items-center gap-1.5">
                          {copiedId === item.id ? (
                            <span className="px-2.5 py-1 rounded-md bg-[#E2ECD6] text-[#354B1D] text-[10.5px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </span>
                          ) : (
                            <button
                              onClick={handleInspectRow}
                              className="px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] bg-[#43532B] hover:bg-[#364422] rounded-lg transition-colors cursor-pointer active:translate-y-px"
                            >
                              Inspect
                            </button>
                          )}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 text-[#5A718E] hover:text-[#0F2D59] rounded-md hover:bg-[#EFECE1] transition-colors cursor-pointer"
                            title="More structure options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {openMenuId === item.id && (
                          <div className="absolute right-4 top-12 z-30 w-48 bg-[#FAF8F3] border border-[#DCD6C6] rounded-xl shadow-lg py-1.5 text-left text-xs">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleInspectRow();
                              }}
                              className="w-full px-3.5 py-2 hover:bg-[#F0ECE1] text-[#0F2D59] font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#43532B]" />
                              <span>Focus on Siting Map</span>
                            </button>
                            <button
                              onClick={() => handleCopySpecs(item)}
                              className="w-full px-3.5 py-2 hover:bg-[#F0ECE1] text-[#0F2D59] font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#1E4477]" />
                              <span>Copy Structure Specs</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                if (onOpenAssumptionsModal) onOpenAssumptionsModal();
                              }}
                              className="w-full px-3.5 py-2 hover:bg-[#F0ECE1] text-[#0F2D59] font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[#5A718E]" />
                              <span>CGWB Methodology</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Load More / Pagination Summary Strip */}
      <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F2EFE6] border border-[#E4DFD2] flex items-center justify-center text-[#0F2D59]">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F2D59]">
              {remainingCount > 0
                ? `+${remainingCount} more recommended sites`
                : `All ${filteredItems.length} recommended sites displayed`}
            </div>
            <div className="text-[11px] text-[#5A718E]">
              Showing {displayedItems.length} of {filteredItems.length} priority structures
            </div>
          </div>
        </div>

        {filteredItems.length > 10 && (
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="px-4 py-2 rounded-lg bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#DCD6C6] text-xs font-semibold text-[#0F2D59] flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
          >
            <span>{showAllRows ? 'Show Top 10 Only' : 'Load More Sites'}</span>
            {showAllRows ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 7. Bottom Statutory Screening Estimate Notice */}
      <div className="bg-[#EEF4FA] border border-[#D4E2F0] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#2C4566]">
          <span className="w-5 h-5 rounded-full bg-[#1E4477] text-[#FAF8F3] text-xs font-bold flex items-center justify-center shrink-0">
            i
          </span>
          <span>
            <strong className="text-[#0F2D59]">Screening-level estimate (PRD §8):</strong> Requires site level survey, double-ring infiltration test, and municipal permission before excavation.
          </span>
        </div>

        <button
          onClick={onOpenAssumptionsModal}
          className="text-xs font-bold text-[#1E4477] hover:text-[#0F2D59] flex items-center gap-1 whitespace-nowrap cursor-pointer"
        >
          <span>View Methodology</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
