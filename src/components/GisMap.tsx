import React, { useState, useRef, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Hotspot, CandidateSite, MatchedSite, RejectedSite } from '../types/hydrology';

interface GisMapProps {
  hotspots: Hotspot[];
  candidateSites: CandidateSite[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hs: Hotspot) => void;
  selectedSite: CandidateSite | null;
  onSelectSite: (site: CandidateSite | null) => void;
  topMatches: MatchedSite[];
  rejectedSites: RejectedSite[];
  activeStormRainfallMm: number;
  mapMode?: 'satellite' | 'vector' | 'topo';
  onCycleMapMode?: () => void;
  showFlowHeatmap?: boolean;
  heatmapOpacity?: number;
}

// Controller to smoothly pan/zoom Google Map when a hotspot or candidate site is selected
const MapController: React.FC<{
  selectedHotspot: Hotspot | null;
  selectedSite: CandidateSite | null;
}> = ({ selectedHotspot, selectedSite }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedSite) {
      map.panTo({ lat: selectedSite.coords.lat, lng: selectedSite.coords.lng });
      map.setZoom(16);
    } else if (selectedHotspot) {
      map.panTo({ lat: selectedHotspot.coords.lat, lng: selectedHotspot.coords.lng });
      map.setZoom(14.6);
    }
  }, [map, selectedHotspot, selectedSite]);

  return null;
};

export const GisMap: React.FC<GisMapProps> = ({
  hotspots,
  candidateSites,
  selectedHotspot,
  onSelectHotspot,
  selectedSite,
  onSelectSite,
  topMatches,
  mapMode = 'satellite',
  showFlowHeatmap = true,
  heatmapOpacity = 0.75,
}) => {
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>(null);

  // Cartographic Canvas state for Topo Survey mode
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // API Key from environment or fallback
  const googleMapsApiKey =
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDKOxFkQ84KzVulYtjuK_YI8fN3oHTv8VU';

  const defaultCenter = { lat: 28.5710, lng: 77.2320 }; // South Delhi Ward 142

  // Surveyor Canvas interaction handlers for Topo mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || mapMode !== 'topo') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mapMode !== 'topo') return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mapMode !== 'topo') return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.75), 3.5));
  };

  const contourLines = [
    { elev: 218, d: 'M 100 850 Q 500 780 900 820', label: '218m MSL (Siri Fort Ridge)' },
    { elev: 216, d: 'M 120 740 Q 500 680 880 710', label: '216m MSL' },
    { elev: 214, d: 'M 150 630 Q 500 580 860 610', label: '214m MSL' },
    { elev: 212, d: 'M 180 520 Q 500 480 840 500', label: '212m MSL' },
    { elev: 210, d: 'M 210 400 Q 510 380 830 390', label: '210m MSL' },
    { elev: 208, d: 'M 250 260 Q 520 250 820 270', label: '208m MSL (Nala Sink)' },
  ];

  const matchedSiteIds = new Set(topMatches.map((m) => m.site.id));
  const activeInfoWindowHotspot = hotspots.find((h) => h.id === activeInfoWindowId);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 w-full h-full min-h-[360px] sm:min-h-[480px] lg:min-h-[610px] rounded-xl border border-[#DCD6C6] bg-[#F3EFE6] overflow-hidden select-none font-sans"
    >
      {mapMode !== 'topo' ? (
        <APIProvider apiKey={googleMapsApiKey}>
          <div className="w-full h-full relative">
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={14.5}
              mapTypeId={mapMode === 'satellite' ? 'hybrid' : 'roadmap'}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={false}
              zoomControl={true}
              streetViewControl={false}
              mapTypeControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              <MapController selectedHotspot={selectedHotspot} selectedSite={selectedSite} />

              {/* Hotspot Markers on Google Maps - Cobalt Blue with Warm White Callouts */}
              {hotspots.map((hs) => {
                const isSelected = selectedHotspot?.id === hs.id;
                return (
                  <AdvancedMarker
                    key={hs.id}
                    position={{ lat: hs.coords.lat, lng: hs.coords.lng }}
                    onClick={() => {
                      onSelectHotspot(hs);
                      setActiveInfoWindowId(hs.id);
                    }}
                    title={`${hs.name} (${hs.elevation}m MSL)`}
                  >
                    <div className="relative group cursor-pointer flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center bg-[#163B6E] text-[#FAF8F3] text-[10px] font-mono font-bold border-2 shadow-sm ${
                          isSelected ? 'border-[#FAF8F3] ring-2 ring-[#43532B] scale-110' : 'border-[#FAF8F3]'
                        }`}
                      >
                        {hs.reportCount > 0 ? hs.reportCount : 'H'}
                      </div>
                      <div className="bg-[#FAF8F3]/95 text-[#0F2D59] border border-[#DCD6C6] text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap font-sans font-bold shadow-xs">
                        <div>{hs.name.split(' (')[0]}</div>
                        <div className="font-mono text-[9.5px] text-[#4A6588] font-medium">
                          {hs.elevation.toFixed(1)} m
                        </div>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Candidate Site Markers on Google Maps - Deep Olive */}
              {candidateSites.map((site) => {
                const isMatched = matchedSiteIds.has(site.id);
                const isSelected = selectedSite?.id === site.id;
                const isUphill = selectedHotspot && site.elevation > selectedHotspot.elevation + 0.3;

                return (
                  <AdvancedMarker
                    key={site.id}
                    position={{ lat: site.coords.lat, lng: site.coords.lng }}
                    onClick={() => onSelectSite(site)}
                    title={`${site.name} (${site.elevation}m MSL)`}
                  >
                    <div className="cursor-pointer flex flex-col items-center group">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[#FAF8F3] text-[8.5px] font-mono font-bold border-2 ${
                          isUphill
                            ? 'bg-[#647D9E]/80 border-[#FAF8F3]'
                            : 'bg-[#43532B] border-[#FAF8F3]'
                        } ${
                          isSelected
                            ? 'ring-2 ring-[#0F2D59] scale-125'
                            : isMatched
                            ? 'ring-2 ring-[#FAF8F3]'
                            : ''
                        }`}
                      >
                        {site.type === 'public_park' ? 'P' : site.type === 'institutional' ? 'S' : 'M'}
                      </div>

                      {isMatched && (
                        <div className="mt-1 bg-[#43532B] text-[#FAF8F3] text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-sans font-semibold shadow-xs">
                          #{topMatches.find((m) => m.site.id === site.id)?.rank} · {site.name.slice(0, 14)}...
                        </div>
                      )}
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* InfoWindow on Selected Hotspot */}
              {activeInfoWindowHotspot && (
                <InfoWindow
                  position={{
                    lat: activeInfoWindowHotspot.coords.lat,
                    lng: activeInfoWindowHotspot.coords.lng,
                  }}
                  onCloseClick={() => setActiveInfoWindowId(null)}
                >
                  <div className="p-1 max-w-xs font-sans text-xs space-y-1.5 text-[#0F2D59] bg-[#FAF8F3]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#0F2D59]">
                        {activeInfoWindowHotspot.id.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#647D9E]">·</span>
                      <span className="text-[10.5px] text-[#43532B] font-semibold">
                        {activeInfoWindowHotspot.confidence === 'reports_only'
                          ? 'Crowdsourced Field Spot'
                          : `${activeInfoWindowHotspot.reportCount} reports`}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[#0F2D59] leading-tight">
                      {activeInfoWindowHotspot.name}
                    </h4>
                    <p className="text-[11px] text-[#3B5988] leading-snug">
                      {activeInfoWindowHotspot.historicalNotes}
                    </p>
                    <div className="flex items-center justify-between text-[10.5px] border-t border-[#DDD6C8] pt-1 mt-1 font-mono text-[#0F2D59]">
                      <span>Elevation: {activeInfoWindowHotspot.elevation}m MSL</span>
                      <span className="font-semibold capitalize">
                        {activeInfoWindowHotspot.typicalDepth.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </InfoWindow>
              )}

              {/* InfoWindow on Focused Candidate Site */}
              {selectedSite && (
                <InfoWindow
                  position={{
                    lat: selectedSite.coords.lat,
                    lng: selectedSite.coords.lng,
                  }}
                  onCloseClick={() => onSelectSite(null)}
                >
                  <div className="p-1 max-w-xs font-sans text-xs space-y-1.5 text-[#0F2D59] bg-[#FAF8F3]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#43532B] text-[#FAF8F3] rounded text-[9.5px] font-mono font-bold uppercase">
                        Candidate Sink
                      </span>
                      <span className="text-[10.5px] text-[#4A6588] font-mono">
                        {selectedSite.elevation.toFixed(1)}m MSL
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[#0F2D59] leading-tight">
                      {selectedSite.name}
                    </h4>
                    <p className="text-[11px] text-[#3B5988] leading-snug">
                      {selectedSite.ownershipName} · Soil: {selectedSite.soilClass.replace(/_/g, ' ')} ({selectedSite.infiltrationRateMmHr.base} mm/h)
                    </p>
                  </div>
                </InfoWindow>
              )}
            </Map>

            {/* Topographical Water Flow Accumulation Heatmap Overlay on Google Map */}
            {showFlowHeatmap && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
                style={{ opacity: heatmapOpacity }}
              >
                <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                  <defs>
                    <radialGradient id="heat-sink-kushak" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1B3A6B" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#3B5988" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#647D9E" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="heat-sink-moolchand" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1B3A6B" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#3B5988" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#647D9E" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id="heat-corridor-nala" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#647D9E" stopOpacity="0.3" />
                      <stop offset="40%" stopColor="#1B3A6B" stopOpacity="0.75" />
                      <stop offset="80%" stopColor="#4A5C30" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#3B5988" stopOpacity="0.35" />
                    </linearGradient>

                    <filter id="heat-blur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="16" />
                    </filter>
                  </defs>

                  <path
                    d="M 140 360 C 260 320, 380 290, 520 220 C 660 150, 780 110, 940 80"
                    fill="none"
                    stroke="url(#heat-corridor-nala)"
                    strokeWidth="56"
                    strokeLinecap="round"
                    filter="url(#heat-blur)"
                  />

                  <path
                    d="M 520 680 C 520 580, 520 510, 520 440"
                    fill="none"
                    stroke="#1B3A6B"
                    strokeWidth="42"
                    strokeLinecap="round"
                    filter="url(#heat-blur)"
                    opacity="0.7"
                  />

                  <path
                    d="M 230 460 C 260 380, 330 280, 380 150"
                    fill="none"
                    stroke="#3B5988"
                    strokeWidth="38"
                    strokeLinecap="round"
                    filter="url(#heat-blur)"
                    opacity="0.65"
                  />

                  <circle cx="520" cy="480" r="70" fill="url(#heat-sink-moolchand)" filter="url(#heat-blur)" />
                  <circle cx="600" cy="120" r="95" fill="url(#heat-sink-kushak)" filter="url(#heat-blur)" />
                  <circle cx="410" cy="310" r="65" fill="url(#heat-sink-kushak)" filter="url(#heat-blur)" />
                </svg>
              </div>
            )}
          </div>
        </APIProvider>
      ) : (
        /* Mode 3: Cartographic Surveyor Plan SVG */
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <pattern id="surveyor-grid-carto" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#DDD6C8" strokeWidth="0.75" />
              <circle cx="80" cy="80" r="1.5" fill="#CFC7B7" />
            </pattern>
            <marker id="carto-flow-arrow-2" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#4A5C30" />
            </marker>
            <filter id="carto-heat-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          <rect width="1000" height="1000" fill="url(#surveyor-grid-carto)" />

          {showFlowHeatmap && (
            <g opacity={heatmapOpacity}>
              <path
                d="M 140 360 C 260 320, 380 290, 520 220 C 660 150, 780 110, 940 80"
                fill="none"
                stroke="#1B3A6B"
                strokeWidth="68"
                filter="url(#carto-heat-blur)"
                strokeOpacity="0.35"
              />
              <path
                d="M 520 680 C 520 580, 520 510, 520 440"
                fill="none"
                stroke="#3B5988"
                strokeWidth="48"
                filter="url(#carto-heat-blur)"
                strokeOpacity="0.35"
              />
              <circle cx="520" cy="480" r="85" fill="#1B3A6B" filter="url(#carto-heat-blur)" fillOpacity="0.45" />
              <circle cx="600" cy="120" r="105" fill="#1B3A6B" filter="url(#carto-heat-blur)" fillOpacity="0.5" />
            </g>
          )}

          {/* Kushak Nala Waterway Channel */}
          <path
            d="M 180 340 C 280 310, 390 290, 520 220 C 650 150, 780 110, 920 80"
            fill="none"
            stroke="#BFD1E8"
            strokeWidth="14"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          <path
            d="M 180 340 C 280 310, 390 290, 520 220 C 650 150, 780 110, 920 80"
            fill="none"
            stroke="#1B3A6B"
            strokeWidth="3"
            strokeDasharray="9,5"
          />

          {/* Elevation Contours */}
          <g>
            {contourLines.map((line) => (
              <g key={line.elev}>
                <path d={line.d} fill="none" stroke="#BFB5A2" strokeWidth="1" strokeDasharray="5,4" />
                <text x="800" y={line.d.split(' ')[2]} fill="#3B5988" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {line.label}
                </text>
              </g>
            ))}
          </g>

          {/* Arterial Road Geometry */}
          <g stroke="#D8D0C0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 120 420 Q 520 490 920 450" />
            <path d="M 520 80 L 520 880" />
            <path d="M 360 100 L 360 850" />
            <path d="M 280 200 L 280 880" />
          </g>

          {/* Gravity Flow Vectors */}
          {selectedHotspot && (
            <g>
              {topMatches.map((match, idx) => {
                const hsX = selectedHotspot.coords.x;
                const hsY = selectedHotspot.coords.y;
                const siteX = match.site.coords.x;
                const siteY = match.site.coords.y;
                const midX = (hsX + siteX) / 2 + (idx === 0 ? 25 : idx === 1 ? -25 : 0);
                const midY = (hsY + siteY) / 2 + 10;
                const pathD = `M ${hsX} ${hsY} Q ${midX} ${midY} ${siteX} ${siteY}`;

                return (
                  <g key={match.site.id}>
                    <path d={pathD} fill="none" stroke="#E4E8DC" strokeWidth="4" strokeLinecap="round" />
                    <path d={pathD} fill="none" stroke="#4A5C30" strokeWidth="2" strokeDasharray="6,4" markerEnd="url(#carto-flow-arrow-2)" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Candidate Sites - Deep Olive */}
          <g>
            {candidateSites.map((site) => {
              const isMatched = matchedSiteIds.has(site.id);
              const isSelected = selectedSite?.id === site.id;
              const isUphill = selectedHotspot && site.elevation > selectedHotspot.elevation + 0.3;
              const size = Math.max(12, Math.min(26, Math.sqrt(site.totalAreaM2) / 10));

              return (
                <g
                  key={site.id}
                  transform={`translate(${site.coords.x}, ${site.coords.y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectSite(site)}
                >
                  <rect
                    x={-size / 2}
                    y={-size / 2}
                    width={size}
                    height={size}
                    rx="1.5"
                    fill={isUphill ? '#94A3B8' : '#4A5C30'}
                    stroke={isSelected || isMatched ? '#1B3A6B' : '#F9F7F2'}
                    strokeWidth={isSelected || isMatched ? 2.5 : 1.5}
                  />
                </g>
              );
            })}
          </g>

          {/* Hotspots - Cobalt Blue */}
          <g>
            {hotspots.map((hs) => {
              const isSelected = selectedHotspot?.id === hs.id;
              return (
                <g
                  key={hs.id}
                  transform={`translate(${hs.coords.x}, ${hs.coords.y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectHotspot(hs)}
                >
                  <circle r={isSelected ? '14' : '11'} fill="#F9F7F2" stroke="#1B3A6B" strokeWidth={isSelected ? '3' : '2'} />
                  <circle r="6" fill="#1B3A6B" />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Bottom-Left Floating Legend Card */}
      <div className="absolute bottom-3.5 left-3.5 z-20 bg-[#FAF8F3]/95 backdrop-blur-xs border border-[#E4DFD2] rounded-xl p-3.5 shadow-sm w-[215px] space-y-2.5 text-xs pointer-events-none">
        <div>
          <span className="font-bold text-[#0F2D59] text-[11.5px] block mb-1.5">Flow intensity</span>
          <div className="flex items-center gap-2">
            <div className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-[#A5CEF5] via-[#2B6CB0] to-[#0D2B54]" />
            <span className="text-[11px] text-[#4A6588] font-medium">High</span>
          </div>
        </div>

        <div className="pt-1 border-t border-[#E8E3D5] space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#163B6E] shrink-0" />
            <span className="text-[#2C4566] font-medium">Flood origins (Cobalt)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#43532B] shrink-0" />
            <span className="text-[#2C4566] font-medium">Candidate sinks (Deep Olive)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
