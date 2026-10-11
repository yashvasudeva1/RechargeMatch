import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Grid,
  Share2,
  Layers,
  SlidersHorizontal,
  PlusSquare,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  Hotspot,
  CandidateSite,
  StormEvent,
  ScoringWeights,
  CitizenReport,
} from './types/hydrology';
import {
  SEEDED_HOTSPOTS,
  CANDIDATE_SITES,
  STORM_EVENTS,
  DEFAULT_WEIGHTS,
  INITIAL_CITIZEN_REPORTS,
  DEMO_WARD_INFO,
} from './data/wardData';
import { runWardMatching } from './utils/matchingEngine';
import { exportWardPlanToCsv } from './utils/csvExport';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { GisMap } from './components/GisMap';
import { HotspotPanel } from './components/HotspotPanel';
import { BuildListTable } from './components/BuildListTable';
import { CitizenReportModal } from './components/CitizenReportModal';
import { StormReplaySelector } from './components/StormReplaySelector';
import { WeightTuningModal } from './components/WeightTuningModal';
import { AssumptionsModal } from './components/AssumptionsModal';
import { ValidationTestsModal } from './components/ValidationTestsModal';
import { ExpertValidationModal } from './components/ExpertValidationModal';
import { DemoScriptModal } from './components/DemoScriptModal';
import { fetchWardDatasetFromAws, submitCitizenReportToAws } from './services/awsService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'map' | 'build-list' | 'tests' | 'validation'>('landing');

  const [hotspots, setHotspots] = useState<Hotspot[]>(SEEDED_HOTSPOTS);
  const [candidateSites, setCandidateSites] = useState<CandidateSite[]>(CANDIDATE_SITES);
  const [activeStorm, setActiveStorm] = useState<StormEvent>(STORM_EVENTS[0]);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [, setCitizenReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);

  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('hs-1');
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);
  const [selectedMatchRank, setSelectedMatchRank] = useState<number>(1);

  const [mapMode, setMapMode] = useState<'satellite' | 'vector' | 'topo'>('satellite');
  const [showFlowHeatmap, setShowFlowHeatmap] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.85);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'seeded_only' | 'seeded_plus_reports' | 'reports_only'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'waist_or_above' | 'knee' | 'ankle'>('all');
  const [bottomTrayTab, setBottomTrayTab] = useState<'matches' | 'excluded' | 'catchment'>('matches');
  const [sortBy, setSortBy] = useState<'score' | 'drop' | 'distance'>('score');

  const bottomTrayRef = useRef<HTMLDivElement>(null);

  const [isStormModalOpen, setIsStormModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState(false);
  const [isDemoScriptModalOpen, setIsDemoScriptModalOpen] = useState(false);

  useEffect(() => {
    fetchWardDatasetFromAws('ward-142').then((remoteData) => {
      if (remoteData) {
        if (remoteData.hotspots?.length) setHotspots(remoteData.hotspots);
        if (remoteData.candidateSites?.length) setCandidateSites(remoteData.candidateSites);
        if (remoteData.reports?.length) setCitizenReports(remoteData.reports);
      }
    });
  }, []);

  const { results, wardSummary } = useMemo(() => {
    return runWardMatching(hotspots, candidateSites, activeStorm, weights);
  }, [hotspots, candidateSites, activeStorm, weights]);

  const visibleHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (confidenceFilter !== 'all' && h.confidence !== confidenceFilter) return false;
      if (priorityFilter !== 'all' && h.typicalDepth !== priorityFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = h.name.toLowerCase().includes(q) || h.locationName.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      return true;
    });
  }, [hotspots, confidenceFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (visibleHotspots.length > 0 && !visibleHotspots.some((h) => h.id === selectedHotspotId)) {
      setSelectedHotspotId(visibleHotspots[0].id);
      setSelectedSite(null);
      setSelectedMatchRank(1);
    }
  }, [visibleHotspots, selectedHotspotId]);

  // Selected Hotspot Match Result
  const selectedHotspot = useMemo(() => {
    return hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0] || null;
  }, [hotspots, selectedHotspotId]);

  const currentMatchResult = useMemo(() => {
    if (!selectedHotspot) return null;
    return results[selectedHotspot.id] || null;
  }, [selectedHotspot, results]);

  // Sorted Top Matches for Bottom Strip
  const sortedTopMatches = useMemo(() => {
    if (!currentMatchResult) return [];
    const list = [...currentMatchResult.topMatches];
    if (sortBy === 'drop') {
      list.sort((a, b) => b.elevationDropM - a.elevationDropM);
    } else if (sortBy === 'distance') {
      list.sort((a, b) => a.flowPathDistanceM - b.flowPathDistanceM);
    } else {
      list.sort((a, b) => b.scoreBreakdown.totalWeightedScore - a.scoreBreakdown.totalWeightedScore);
    }
    return list;
  }, [currentMatchResult, sortBy]);

  const handleCitizenReportSubmit = useCallback(
    (newReportData: Omit<CitizenReport, 'id' | 'timestamp' | 'verifiedByPlanner'>) => {
      const newReport: CitizenReport = {
        ...newReportData,
        id: `rep-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        verifiedByPlanner: true,
      };

      setCitizenReports((prev) => [newReport, ...prev]);
      submitCitizenReportToAws(newReport).catch(() => {});

      if (newReportData.hotspotId) {
        setHotspots((prev) =>
          prev.map((h) => {
            if (h.id === newReportData.hotspotId) {
              return {
                ...h,
                reportCount: h.reportCount + 1,
                confidence: 'seeded_plus_reports',
              };
            }
            return h;
          })
        );
        setSelectedHotspotId(newReportData.hotspotId);
      } else {
        const newHsId = `hs-${Date.now()}`;
        const newHotspot: Hotspot = {
          id: newHsId,
          name: newReportData.locationName || 'Citizen Field Report Spot',
          locationName: newReportData.locationName || 'South Delhi Ward 142 Corridor',
          coords: newReportData.coords,
          elevation: 211.2,
          confidence: 'reports_only',
          reportCount: 1,
          catchmentAreaM2: 19500,
          landCover: { pavedPercent: 76, roofPercent: 16, greenPercent: 8 },
          weightedRunoffCoeff: 0.83,
          typicalDepth: newReportData.depthCategory,
          typicalDuration: newReportData.durationCategory,
          sewageAdjacent: false,
          nearestNalaDistanceM: 380,
          historicalNotes: newReportData.notes || 'Crowd-sourced waterlogging report with anonymized EXIF data.',
        };

        setHotspots((prev) => [newHotspot, ...prev]);
        setSelectedHotspotId(newHsId);
        setActiveTab('map');
      }
    },
    []
  );

  const handleSelectHotspotById = useCallback((id: string) => {
    setConfidenceFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setSelectedHotspotId(id);
    setSelectedSite(null);
    setSelectedMatchRank(1);
    setActiveTab('map');
  }, []);

  const handleInspectStructure = useCallback(
    (hotspotId: string, siteId: string, rank: number) => {
      setConfidenceFilter('all');
      setPriorityFilter('all');
      setSearchQuery('');
      setSelectedHotspotId(hotspotId);
      setSelectedMatchRank(rank);
      const targetSite = candidateSites.find((s) => s.id === siteId) || null;
      setSelectedSite(targetSite);
      setActiveTab('map');
    },
    [candidateSites]
  );

  const handleSelectStormById = useCallback((stormId: string) => {
    const storm = STORM_EVENTS.find((s) => s.id === stormId);
    if (storm) {
      setActiveStorm(storm);
    }
  }, []);

  const cycleMapMode = useCallback(() => {
    setMapMode((prev) => (prev === 'satellite' ? 'vector' : prev === 'vector' ? 'topo' : 'satellite'));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7EF] text-[#0F2D59] flex flex-col font-sans selection:bg-[#43532B] selection:text-[#FAF8F3]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeStorm={activeStorm}
        onOpenStormSelector={() => setIsStormModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onExportCsv={() => exportWardPlanToCsv(results, activeStorm, weights, DEMO_WARD_INFO.wardName)}
      />

      {/* Page 1: Full-Bleed Single-Screen Landing Page */}
      {activeTab === 'landing' ? (
        <LandingPage
          onLaunchPlanner={() => setActiveTab('map')}
          onViewBuildList={() => setActiveTab('build-list')}
          onViewTests={() => setActiveTab('tests')}
          onOpenDemoScript={() => setIsDemoScriptModalOpen(true)}
          activeStorm={activeStorm}
          wardSummary={wardSummary}
        />
      ) : activeTab === 'map' ? (
        /* Page 2: Siting Map Workspace */
        <div className="flex-1 flex flex-col bg-[#F5F2E9]">
          <div className="flex-1 flex">
            {/* Main Siting Map Content Column */}
            <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-10 py-5 space-y-3.5 max-w-[1440px] mx-auto w-full">
              {/* Row 1: Breadcrumb, Siting Map Title & 3 Summary KPI Cards */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#1E4477]">
                    <span>Ward 142 (Defence Colony / Lajpat Nagar)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#5A718E]" />
                    <span>Kushak Nala Sub-Basin</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#5A718E]" />
                    <span className="text-[#4A6588] font-medium">
                      Barapullah Trunk Catchment (Yamuna Basin)
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-[32px] font-bold text-[#0F2D59] tracking-tight leading-tight mt-0.5">
                    Siting Map
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#4A6588] mt-0.5">
                    Identify and evaluate potential recharge sites using hydrological analysis, terrain data and ground conditions.
                  </p>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex items-center gap-2.5 sm:gap-3 shrink-0">
                  {/* Card 1: Runoff */}
                  <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[170px]">
                    <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
                      <path
                        d="M11 22H25.5C28.5 22 31 19.5 31 16.5C31 13.7 28.9 11.4 26.2 11.1C25.1 6.5 21 3 16 3C10.5 3 6 7.5 6 13C6 13.5 6.1 14 6.2 14.5C4.3 15.4 3 17.3 3 19.5C3 22 5 22 7.5 22H11Z"
                        fill="#7AB3E0"
                      />
                      <circle cx="12" cy="27" r="1.5" fill="#1E60B8" />
                      <circle cx="18" cy="29" r="1.5" fill="#1E60B8" />
                      <circle cx="24" cy="27" r="1.5" fill="#1E60B8" />
                    </svg>
                    <div>
                      <div className="text-base sm:text-[18px] font-extrabold text-[#0F2D59] leading-tight">
                        {wardSummary.totalRunoffM3.base.toLocaleString()} m³
                      </div>
                      <div className="text-[11px] text-[#5A718E]">Runoff (annual est.)</div>
                    </div>
                  </div>

                  {/* Card 2: Absorption Gap */}
                  <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[160px]">
                    <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M16 4C16 4 7 14.5 7 20.5C7 25.5 11 29.5 16 29.5C21 29.5 25 25.5 25 20.5C25 14.5 16 4 16 4Z"
                        fill="#3B76B8"
                      />
                    </svg>
                    <div>
                      <div className="text-base sm:text-[18px] font-extrabold text-[#0F2D59] leading-tight">
                        {wardSummary.wardAbsorptionGapM3.base.toLocaleString()} m³
                      </div>
                      <div className="text-[11px] text-[#5A718E]">Absorption gap</div>
                    </div>
                  </div>

                  {/* Card 3: Over-exploited (CGWB 2023) */}
                  <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[175px]">
                    <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
                      <rect x="6" y="21" width="4.5" height="9" rx="1" fill="#5A6E3E" />
                      <rect x="13" y="16" width="4.5" height="14" rx="1" fill="#43532B" />
                      <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#43532B" />
                      <path d="M28 24V9M28 9L24.5 12.5M28 9L31.5 12.5" stroke="#43532B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <div className="text-base sm:text-[18px] font-extrabold text-[#0F2D59] leading-tight">
                        124.3%
                      </div>
                      <div className="text-[10.5px] text-[#5A718E] leading-tight">
                        Over-exploited
                        <br />
                        (CGWB 2023)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Two-Tier Map Control & Filter Bar */}
              <div className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl px-3.5 py-2.5 space-y-2">
                {/* Tier 1: Map Mode Buttons, Flow Heatmap Switch, Opacity Slider & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Satellite / Vector / Topo Switcher */}
                    <button
                      onClick={() => setMapMode('satellite')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        mapMode === 'satellite'
                          ? 'bg-[#43532B] text-[#FAF8F3]'
                          : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] text-[#1B3A6B] border border-[#DCD6C6]'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>Satellite</span>
                    </button>

                    <button
                      onClick={() => setMapMode('vector')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        mapMode === 'vector'
                          ? 'bg-[#43532B] text-[#FAF8F3]'
                          : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] text-[#1B3A6B] border border-[#DCD6C6]'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Vector</span>
                    </button>

                    <button
                      onClick={() => setMapMode('topo')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        mapMode === 'topo'
                          ? 'bg-[#43532B] text-[#FAF8F3]'
                          : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] text-[#1B3A6B] border border-[#DCD6C6]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Topo</span>
                    </button>

                    <span className="hidden sm:inline text-[#DCD6C6] mx-1">|</span>

                    {/* Flow Heatmap Pill + Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFlowHeatmap(!showFlowHeatmap)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F3EFE4] border border-[#DCD6C6] text-[#0F2D59] flex items-center gap-1.5 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#43532B]" />
                        <span>Flow Heatmap</span>
                      </button>

                      {/* Olive Toggle Pill */}
                      <button
                        onClick={() => setShowFlowHeatmap(!showFlowHeatmap)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          showFlowHeatmap ? 'bg-[#43532B] justify-end' : 'bg-[#C5BFA8] justify-start'
                        }`}
                        title="Toggle Flow Heatmap"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#FAF8F3] block shadow-xs" />
                      </button>
                    </div>

                    {/* Opacity Slider */}
                    <div className="hidden sm:flex items-center gap-2 ml-2 text-xs text-[#5A718E]">
                      <span>Opacity</span>
                      <input
                        type="range"
                        min="0.15"
                        max="1"
                        step="0.05"
                        value={heatmapOpacity}
                        onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                        className="w-24 accent-[#43532B] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Location Search Box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#5A718E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search location, landmark..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FAF8F3] border border-[#DCD6C6] rounded-lg text-[#0F2D59] placeholder-[#7A8CA5] focus:outline-none focus:border-[#43532B]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E829C] hover:text-[#0F2D59] cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tier 2: Confidence & Depth Filters + Active Hotspots Count */}
                <div className="pt-2 border-t border-[#ECE7DA] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 max-w-full">
                    {/* Confidence Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                      <span className="text-[#4A6588] mr-1 shrink-0">Confidence</span>
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'seeded_only', label: 'Baseline' },
                        { id: 'seeded_plus_reports', label: 'Verified' },
                        { id: 'reports_only', label: 'Crowdsourced' },
                      ].map((cf) => (
                        <button
                          key={cf.id}
                          onClick={() => setConfidenceFilter(cf.id as any)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer shrink-0 ${
                            confidenceFilter === cf.id
                              ? 'bg-[#43532B] text-[#FAF8F3] font-semibold'
                              : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#E4DFD2] text-[#2C4566]'
                          }`}
                        >
                          {cf.label}
                        </button>
                      ))}
                    </div>

                    {/* Depth Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                      <span className="text-[#4A6588] mr-1 shrink-0">Depth</span>
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'waist_or_above', label: 'Waist' },
                        { id: 'knee', label: 'Knee' },
                        { id: 'ankle', label: 'Ankle' },
                      ].map((pf) => (
                        <button
                          key={pf.id}
                          onClick={() => setPriorityFilter(pf.id as any)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer shrink-0 ${
                            priorityFilter === pf.id
                              ? 'bg-[#43532B] text-[#FAF8F3] font-semibold'
                              : 'bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#E4DFD2] text-[#2C4566]'
                          }`}
                        >
                          {pf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {(confidenceFilter !== 'all' || priorityFilter !== 'all' || searchQuery !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfidenceFilter('all');
                          setPriorityFilter('all');
                          setSearchQuery('');
                        }}
                        className="text-xs font-semibold text-[#1E4477] hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                    <span className="text-xs text-[#4A6588] font-medium">
                      {visibleHotspots.length} active hotspots
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Split Main Map & Selected Hotspot Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column: Interactive Siting Map */}
                <div className="lg:col-span-6 flex flex-col">
                  <GisMap
                    hotspots={visibleHotspots}
                    candidateSites={candidateSites}
                    selectedHotspot={selectedHotspot}
                    onSelectHotspot={(hs) => {
                      setSelectedHotspotId(hs.id);
                      setSelectedSite(null);
                      setSelectedMatchRank(1);
                    }}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    topMatches={currentMatchResult ? currentMatchResult.topMatches : []}
                    rejectedSites={currentMatchResult ? currentMatchResult.rejectedSites : []}
                    activeStormRainfallMm={activeStorm.rainfallDepthMm}
                    mapMode={mapMode}
                    onCycleMapMode={cycleMapMode}
                    showFlowHeatmap={showFlowHeatmap}
                    heatmapOpacity={heatmapOpacity}
                  />
                </div>

                {/* Right Column: Selected Hotspot & Design Proposal Dossier */}
                <div className="lg:col-span-6 flex flex-col">
                  <HotspotPanel
                    matchResult={currentMatchResult}
                    selectedMatchRank={selectedMatchRank}
                    onSelectMatchRank={setSelectedMatchRank}
                    onSelectSite={setSelectedSite}
                    onOpenReportModal={() => setIsReportModalOpen(true)}
                    onOpenAssumptionsModal={() => setIsAssumptionsModalOpen(true)}
                  />
                </div>
              </div>

              {/* Row 4: Bottom Horizontal Strip (Top Sited Matches / Excluded Sites / Catchment Hydrology) */}
              <div
                ref={bottomTrayRef}
                className="bg-[#FAF8F3] border border-[#E4DFD2] rounded-xl p-3.5 sm:p-4 space-y-3"
              >
                {/* Bottom Strip Header Tabs & Sort Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DFD2] pb-2.5">
                  <div className="flex items-center gap-4 sm:gap-6 text-xs overflow-x-auto whitespace-nowrap max-w-full">
                    <button
                      onClick={() => setBottomTrayTab('matches')}
                      className={`flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
                        bottomTrayTab === 'matches'
                          ? 'border-[#163B6E] text-[#0F2D59] font-bold'
                          : 'border-transparent text-[#5A718E] hover:text-[#0F2D59]'
                      }`}
                    >
                      <PlusSquare className="w-3.5 h-3.5 text-[#163B6E]" />
                      <span>
                        Top Sited Matches ({currentMatchResult ? currentMatchResult.topMatches.length : 0})
                      </span>
                    </button>

                    <button
                      onClick={() => setBottomTrayTab('excluded')}
                      className={`pb-2 -mb-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
                        bottomTrayTab === 'excluded'
                          ? 'border-[#163B6E] text-[#0F2D59] font-bold'
                          : 'border-transparent text-[#5A718E] hover:text-[#0F2D59]'
                      }`}
                    >
                      Excluded Sites ({currentMatchResult ? currentMatchResult.rejectedSites.length : 0})
                    </button>

                    <button
                      onClick={() => setBottomTrayTab('catchment')}
                      className={`pb-2 -mb-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
                        bottomTrayTab === 'catchment'
                          ? 'border-[#163B6E] text-[#0F2D59] font-bold'
                          : 'border-transparent text-[#5A718E] hover:text-[#0F2D59]'
                      }`}
                    >
                      Catchment Hydrology
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5A718E]">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#FAF8F3] border border-[#DCD6C6] rounded-lg px-2.5 py-1 text-xs font-medium text-[#0F2D59] focus:outline-none cursor-pointer"
                    >
                      <option value="score">Score (High -&gt; Low)</option>
                      <option value="drop">Elevation Drop</option>
                      <option value="distance">Shortest Flow Path</option>
                    </select>
                  </div>
                </div>

                {bottomTrayTab === 'matches' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-0.5">
                    {sortedTopMatches.map((match) => {
                      const isActive = selectedMatchRank === match.rank;
                      return (
                        <div
                          key={match.site.id}
                          onClick={() => {
                            setSelectedMatchRank(match.rank);
                            setSelectedSite(match.site);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-[#F4F6EE] border-[#43532B] shadow-xs'
                              : 'bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[#E4DFD2]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-md bg-[#43532B] text-[#FAF8F3] text-xs font-bold flex items-center justify-center shrink-0">
                              {match.rank}
                            </span>

                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#DCD6C6] shrink-0 bg-[#DCE5D0]">
                              <svg viewBox="0 0 56 56" className="w-full h-full">
                                <rect width="56" height="56" fill="#D8E4CA" />
                                <path d="M 0 38 Q 28 32 56 40 L 56 56 L 0 56 Z" fill="#7D9858" />
                                <path d="M 18 56 L 26 36 L 32 36 L 38 56 Z" fill="#C9BC9C" />
                                <circle cx="14" cy="22" r="11" fill="#3D5626" />
                                <circle cx="42" cy="20" r="12" fill="#4B6630" />
                                <circle cx="28" cy="14" r="10" fill="#5D7B3E" />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-[#0F2D59] truncate">
                                  {match.site.name}
                                </h4>
                                {match.rank <= 2 && (
                                  <span className="px-1.5 py-0.5 bg-[#43532B] text-[#FAF8F3] rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-[#4A6588] mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className="capitalize">
                                  {match.site.type === 'public_park'
                                    ? 'Public Park'
                                    : match.site.type === 'municipal_ground'
                                    ? 'Municipal Ground'
                                    : 'Institutional'}
                                </span>
                                <span>|</span>
                                <span className="font-bold text-[#0F2D59]">
                                  ↓ {match.elevationDropM.toFixed(1)}m drop
                                </span>
                                <span>·</span>
                                <span>{match.flowPathDistanceM}m path</span>
                              </div>

                              <div className="w-full h-1.5 bg-[#E4DFD2] rounded-full overflow-hidden mt-2">
                                <div
                                  className="h-full bg-[#43532B] rounded-full"
                                  style={{ width: `${match.scoreBreakdown.totalWeightedScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-1">
                            <span className="text-[10px] text-[#5A718E] block">Score</span>
                            <span className="text-sm font-extrabold text-[#0F2D59]">
                              {match.scoreBreakdown.totalWeightedScore}/100
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {bottomTrayTab === 'excluded' && currentMatchResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 max-h-48 overflow-y-auto">
                    {currentMatchResult.rejectedSites.map((rej) => {
                      const isFocused = selectedSite?.id === rej.site.id;
                      return (
                        <div
                          key={rej.site.id}
                          onClick={() => setSelectedSite(rej.site)}
                          className={`p-3 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                            isFocused
                              ? 'bg-[#F4F6EE] border-[#43532B]'
                              : 'bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[#E4DFD2]'
                          }`}
                          title="Click to focus on map"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#0F2D59] truncate">{rej.site.name}</span>
                            <span className="px-2 py-0.5 bg-[#43532B] text-[#FAF8F3] rounded text-[9.5px] font-mono uppercase shrink-0">
                              {rej.reason.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#4A6588] line-clamp-2">{rej.details}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {bottomTrayTab === 'catchment' && selectedHotspot && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-[#F4F1E8] border border-[#E4DFD2]">
                      <span className="text-[10px] text-[#5A718E] block">Catchment Area (A)</span>
                      <span className="text-sm font-bold text-[#0F2D59]">
                        {selectedHotspot.catchmentAreaM2.toLocaleString()} m²
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F4F1E8] border border-[#E4DFD2]">
                      <span className="text-[10px] text-[#5A718E] block">Runoff Coefficient (C)</span>
                      <span className="text-sm font-bold text-[#0F2D59]">
                        {selectedHotspot.weightedRunoffCoeff.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F4F1E8] border border-[#E4DFD2]">
                      <span className="text-[10px] text-[#5A718E] block">Impervious Surface</span>
                      <span className="text-sm font-bold text-[#0F2D59]">
                        {selectedHotspot.landCover.pavedPercent + selectedHotspot.landCover.roofPercent}% Paved & Roof
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F4F1E8] border border-[#E4DFD2]">
                      <span className="text-[10px] text-[#5A718E] block">Active Storm Depth (P)</span>
                      <span className="text-sm font-bold text-[#0F2D59]">
                        {activeStorm.rainfallDepthMm} mm ({activeStorm.name})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col gap-6">
          {activeTab === 'build-list' && (
            <BuildListTable
              results={results}
              wardSummary={wardSummary}
              activeStorm={activeStorm}
              weights={weights}
              onSelectHotspotById={handleSelectHotspotById}
              onInspectStructure={handleInspectStructure}
              onOpenAssumptionsModal={() => setIsAssumptionsModalOpen(true)}
              onOpenWeightsModal={() => setIsWeightsModalOpen(true)}
              onSwitchToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'tests' && <ValidationTestsModal />}

          {activeTab === 'validation' && (
            <ExpertValidationModal onSelectHotspotById={handleSelectHotspotById} />
          )}
        </main>
      )}

      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        hotspots={hotspots}
        selectedHotspotId={selectedHotspotId}
        onSubmitReport={handleCitizenReportSubmit}
      />

      <StormReplaySelector
        isOpen={isStormModalOpen}
        onClose={() => setIsStormModalOpen(false)}
        stormEvents={STORM_EVENTS}
        activeStormId={activeStorm.id}
        onSelectStorm={setActiveStorm}
      />

      <WeightTuningModal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
        weights={weights}
        onUpdateWeights={setWeights}
      />

      <AssumptionsModal
        isOpen={isAssumptionsModalOpen}
        onClose={() => setIsAssumptionsModalOpen(false)}
      />

      <DemoScriptModal
        isOpen={isDemoScriptModalOpen}
        onClose={() => setIsDemoScriptModalOpen(false)}
        onSelectHotspotById={handleSelectHotspotById}
        onSelectStormById={handleSelectStormById}
        onSwitchTab={setActiveTab}
      />

      {activeTab !== 'landing' && (
        <footer className="border-t border-[#E2DDD0] bg-[#FAF8F3] py-3 px-6 text-xs text-[#4A6588] flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-serif font-bold text-[#0F2D59] text-sm">RechargeMatch</span>
            <span className="text-[#DCD6C6]">|</span>
            <span>Bharat Builds Tour 2026 (Heat & Water Track)</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-[#1B3A6B]">
            <button
              onClick={() => setIsAssumptionsModalOpen(true)}
              className="hover:underline underline-offset-4 cursor-pointer"
            >
              CGWB Hydrological Formulae
            </button>
            <span className="text-[#9AA690]">·</span>
            <button
              onClick={() => setIsWeightsModalOpen(true)}
              className="hover:underline underline-offset-4 cursor-pointer"
            >
              Scoring Weights
            </button>
            <span className="text-[#9AA690]">·</span>
            <button
              onClick={() => setIsDemoScriptModalOpen(true)}
              className="hover:underline underline-offset-4 cursor-pointer"
            >
              3-Min Walkthrough
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
