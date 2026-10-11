import React from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { ScoringWeights } from '../types/hydrology';
import { DEFAULT_WEIGHTS } from '../data/wardData';

interface WeightTuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: ScoringWeights;
  onUpdateWeights: (weights: ScoringWeights) => void;
}

export const WeightTuningModal: React.FC<WeightTuningModalProps> = ({
  isOpen,
  onClose,
  weights,
  onUpdateWeights,
}) => {
  if (!isOpen) return null;

  const total =
    weights.distanceWeight +
    weights.areaWeight +
    weights.soilWeight +
    weights.waterTableWeight +
    weights.floodExposureWeight +
    weights.feasibilityWeight;

  const handleSliderChange = (key: keyof ScoringWeights, val: number) => {
    onUpdateWeights({
      ...weights,
      [key]: val,
    });
  };

  const handleReset = () => {
    onUpdateWeights({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3A6B]/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD6C8] flex items-center justify-between bg-[#F3EFE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 text-[#F9F7F2]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1B3A6B]">
                Tune Siting Heuristic Weights
              </h3>
              <p className="text-[11px] text-[#3B5988]">
                Customize multi-criteria scoring factor weights (PRD Section 6.2).
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

        <div className="p-5 space-y-4">
          {/* Weight Sliders */}
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Flow-Path Distance (along street drains)</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.distanceWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={weights.distanceWeight}
                onChange={(e) => handleSliderChange('distanceWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Penalizes long overland flow distances</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Available Usable Storage Area</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.areaWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={weights.areaWeight}
                onChange={(e) => handleSliderChange('areaWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Rewards larger usable open grounds and park spaces</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Soil Infiltration Suitability</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.soilWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={weights.soilWeight}
                onChange={(e) => handleSliderChange('soilWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Higher score for sandy alluvium vs impermeable silt/clay</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Depth to Water Table</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.waterTableWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={weights.waterTableWeight}
                onChange={(e) => handleSliderChange('waterTableWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Shallow water table (&lt;3m) lowers score heavily</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Site Flood Exposure Resilience</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.floodExposureWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={weights.floodExposureWeight}
                onChange={(e) => handleSliderChange('floodExposureWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Penalizes sites that get saturated during the same storm</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1B3A6B] font-semibold">Land-Use & Municipal Access Feasibility</span>
                <span className="font-mono text-[#1B3A6B] font-bold">{weights.feasibilityWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={weights.feasibilityWeight}
                onChange={(e) => handleSliderChange('feasibilityWeight', Number(e.target.value))}
                className="w-full accent-[#4A5C30] cursor-pointer"
              />
              <span className="text-[10px] text-[#647D9E] block">Public parks &gt; Schools/Institutions &gt; Private parcels</span>
            </div>
          </div>

          {/* Aggregate Total Strip */}
          <div className="py-2.5 border-y border-[#DDD6C8] flex items-center justify-between text-xs">
            <span className="text-[#3B5988]">Sum of Factor Weights:</span>
            <span className="font-mono font-bold text-[#1B3A6B]">
              {total}% {total !== 100 && '(Auto-normalized in engine)'}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] rounded-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F9F7F2]" />
              <span>Reset Baseline (25/20/20/15/10/10)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] rounded-sm transition-all cursor-pointer active:translate-y-px"
            >
              Apply Weights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
