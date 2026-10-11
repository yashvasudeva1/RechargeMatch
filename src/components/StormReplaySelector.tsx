import React from 'react';
import { X, CloudRain, Check } from 'lucide-react';
import { StormEvent } from '../types/hydrology';

interface StormReplaySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  stormEvents: StormEvent[];
  activeStormId: string;
  onSelectStorm: (storm: StormEvent) => void;
}

export const StormReplaySelector: React.FC<StormReplaySelectorProps> = ({
  isOpen,
  onClose,
  stormEvents,
  activeStormId,
  onSelectStorm,
}) => {
  if (!isOpen) return null;

  const designStorms = stormEvents.filter((s) => s.type === 'design_storm');
  const historicalStorms = stormEvents.filter((s) => s.type === 'historical_replay');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3A6B]/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD6C8] flex items-center justify-between bg-[#F3EFE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
              <CloudRain className="w-4 h-4 text-[#F9F7F2]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1B3A6B]">
                Precipitation Scenarios & Historical Storm Replay
              </h3>
              <p className="text-[11px] text-[#3B5988]">
                Select standard municipal design storms or replay actual historical Delhi monsoon downpours.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm bg-[#4A5C30] hover:bg-[#3A4A24] text-[#F9F7F2] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[#F9F7F2]" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Standard Design Storms - Open Ledger Rows */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#647D9E] block mb-2">
              01 · Standard Municipal Design Storms
            </span>
            <div className="divide-y divide-[#DDD6C8] border-y border-[#DDD6C8]">
              {designStorms.map((storm) => {
                const isActive = storm.id === activeStormId;
                return (
                  <div
                    key={storm.id}
                    onClick={() => {
                      onSelectStorm(storm);
                      onClose();
                    }}
                    className={`py-3.5 px-2 cursor-pointer transition-colors ${
                      isActive ? 'bg-[#F3EFE6]' : 'hover:bg-[#F3EFE6]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1B3A6B] font-sans">{storm.name}</h4>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#4A5C30] text-[#F9F7F2] font-semibold flex items-center gap-1 font-mono">
                              <Check className="w-3 h-3 text-[#F9F7F2]" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3B5988] mt-1 leading-relaxed">{storm.description}</p>
                        <span className="text-[10px] text-[#647D9E] block mt-1 font-mono">Source: {storm.source}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-bold text-[#1B3A6B] tabular-nums">
                          {storm.rainfallDepthMm} mm
                        </span>
                        <span className="text-[10px] text-[#647D9E] block font-mono">{storm.durationHours} hrs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Historical Storm Replay - Open Ledger Rows */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#647D9E] block mb-1">
              02 · Storm Replay: Real Historical Delhi Deluges
            </span>
            <p className="text-xs text-[#3B5988] mb-2.5 leading-relaxed">
              Replay real open rainfall measurements (IMD Safdarjung & NASA GPM) over ward hotspots to observe how much runoff could have been captured before severe waterlogging occurred.
            </p>
            <div className="divide-y divide-[#DDD6C8] border-y border-[#DDD6C8]">
              {historicalStorms.map((storm) => {
                const isActive = storm.id === activeStormId;
                return (
                  <div
                    key={storm.id}
                    onClick={() => {
                      onSelectStorm(storm);
                      onClose();
                    }}
                    className={`py-3.5 px-2 cursor-pointer transition-colors ${
                      isActive ? 'bg-[#F3EFE6]' : 'hover:bg-[#F3EFE6]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1B3A6B] font-sans">{storm.name}</h4>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#4A5C30] text-[#F9F7F2] font-semibold flex items-center gap-1 font-mono">
                              <Check className="w-3 h-3 text-[#F9F7F2]" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3B5988] mt-1 leading-relaxed">{storm.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#647D9E] font-mono">
                          <span className="text-[#1B3A6B] font-semibold">{storm.dateLabel}</span>
                          <span>·</span>
                          <span>{storm.source}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-bold text-[#1B3A6B] tabular-nums">
                          {storm.rainfallDepthMm} mm
                        </span>
                        <span className="text-[10px] text-[#647D9E] block font-mono">{storm.durationHours} hrs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-[#F3EFE6] border-t border-[#DDD6C8] text-[11px] text-[#3B5988] text-center">
          Switching precipitation events recomputes runoff and absorption gap across all 10 hotspots dynamically in under 50ms.
        </div>
      </div>
    </div>
  );
};
