import React from 'react';
import { X, Calculator } from 'lucide-react';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3A6B]/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD6C8] flex items-center justify-between bg-[#F3EFE6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4 text-[#F9F7F2]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1B3A6B]">
                Hydrological Estimation Model & Assumptions
              </h3>
              <p className="text-[11px] text-[#3B5988]">
                Formulas, literature parameters, and Central Ground Water Board (CGWB) guidelines (PRD Section 7).
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

        <div className="p-6 space-y-6 overflow-y-auto text-xs leading-relaxed">
          {/* Section 1: Standard Formulas - Open Ledger List */}
          <div>
            <h4 className="text-[10px] font-bold text-[#647D9E] uppercase tracking-[0.14em] mb-2 font-mono">
              01 · Mathematical Formulation
            </h4>
            <div className="divide-y divide-[#DDD6C8] border-y border-[#DDD6C8]">
              <div className="py-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#1B3A6B]">Runoff Volume (m³)</span>
                  <span className="font-mono text-[#1B3A6B] font-bold">V_runoff = C × P × A</span>
                </div>
                <p className="text-xs text-[#3B5988]">
                  <strong className="text-[#1B3A6B]">C:</strong> Area-weighted runoff coefficient (0.25 vegetated green to 0.92 paved asphalt). <strong className="text-[#1B3A6B]">P:</strong> Storm rainfall depth in meters. <strong className="text-[#1B3A6B]">A:</strong> Delineated upstream catchment in m².
                </p>
              </div>

              <div className="py-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#1B3A6B]">Site Storage Capacity (m³)</span>
                  <span className="font-mono text-[#1B3A6B] font-bold">V_store = L × W × D × void_factor</span>
                </div>
                <p className="text-xs text-[#3B5988]">
                  Void factor is 1.0 for open detention ponds and 0.40-0.45 for gravel-filled perimeter infiltration trenches.
                </p>
              </div>

              <div className="py-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#1B3A6B]">Drain-Limited Infiltration Volume (48h) (m³)</span>
                  <span className="font-mono text-[#1B3A6B] font-bold">V_drain = f × A_floor × T</span>
                </div>
                <p className="text-xs text-[#3B5988]">
                  <strong className="text-[#1B3A6B]">f:</strong> Soil infiltration hydraulic conductivity (m/h). <strong className="text-[#1B3A6B]">A_floor:</strong> Infiltrating floor area (m²). <strong className="text-[#1B3A6B]">T:</strong> Design drain-down window = 48 hours.
                </p>
              </div>

              <div className="py-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#1B3A6B]">Design Capacity per Structure (m³)</span>
                  <span className="font-mono text-[#1B3A6B] font-bold">V_design = min(V_store, V_drain)</span>
                </div>
                <p className="text-xs text-[#3B5988]">
                  Takes the lesser of physical tank storage volume and the soil’s realistic capacity to infiltrate within the 48-hour drain window.
                </p>
              </div>

              <div className="py-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#1B3A6B]">Ward Absorption Gap (m³)</span>
                  <span className="font-mono text-[#1B3A6B] font-bold">V_gap = V_runoff − Σ V_design</span>
                </div>
                <p className="text-xs text-[#3B5988]">
                  Reveals the honest residual volume remaining unabsorbed even after deploying the top 3 best available sites.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Soil Infiltration Rates */}
          <div>
            <h4 className="text-[10px] font-bold text-[#647D9E] uppercase tracking-[0.14em] mb-2 font-mono">
              02 · Delhi Older Alluvium Soil Infiltration Parameters (CGWB)
            </h4>
            <div className="border-y border-[#DDD6C8] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3EFE6] text-[#1B3A6B] text-[10px] uppercase font-mono border-b border-[#DDD6C8]">
                  <tr>
                    <th className="py-2.5 px-3">Soil Classification</th>
                    <th className="py-2.5 px-3">Low Rate</th>
                    <th className="py-2.5 px-3">Base (Design)</th>
                    <th className="py-2.5 px-3">High Rate</th>
                    <th className="py-2.5 px-3">CGWB Vadose Suitability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD6C8] font-mono text-[11px] text-[#1B3A6B]">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Sandy Loam</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">18 mm/h</td>
                    <td className="py-2.5 px-3 font-bold">26 mm/h</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">36 mm/h</td>
                    <td className="py-2.5 px-3 font-sans text-[#3B5988]">Excellent (High transmissivity)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Loam</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">12 mm/h</td>
                    <td className="py-2.5 px-3 font-bold">19 mm/h</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">28 mm/h</td>
                    <td className="py-2.5 px-3 font-sans text-[#3B5988]">Good (Standard recharge rate)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Silt Loam</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">6 mm/h</td>
                    <td className="py-2.5 px-3 font-bold">11 mm/h</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">16 mm/h</td>
                    <td className="py-2.5 px-3 font-sans text-[#3B5988]">Moderate (Requires wide trenches)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Clay Loam (Low Sink)</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">3 mm/h</td>
                    <td className="py-2.5 px-3 font-bold">6 mm/h</td>
                    <td className="py-2.5 px-3 text-[#647D9E]">10 mm/h</td>
                    <td className="py-2.5 px-3 font-sans text-[#3B5988]">Poor (Detention basin recommended)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Safety & Quality Rules - Pure Typography */}
          <div>
            <h4 className="text-[10px] font-bold text-[#647D9E] uppercase tracking-[0.14em] mb-2 font-mono">
              03 · Environmental & Groundwater Safety Screening
            </h4>
            <div className="space-y-2.5 text-xs text-[#3B5988] border-l-2 border-[#4A5C30] pl-4">
              <div>
                <strong className="text-[#1B3A6B]">Sewage Contamination Gate:</strong> Hotspots adjacent to Kushak Nala or major unlined sewers are strictly prohibited from direct aquifer injection. They are automatically downgraded to surface detention basins or pre-treatment bio-retention only.
              </div>
              <div>
                <strong className="text-[#1B3A6B]">Mandatory Silt Trap & First-Flush Chamber:</strong> Delhi storm runoff carries high vehicular grit and dust. Every recharge specification mandates a dual-chamber sedimentation forebay.
              </div>
              <div>
                <strong className="text-[#1B3A6B]">Vadose Protection (&gt;3.0m Zone):</strong> Sites with shallow water tables (&lt;3.0m bgl) are flagged to prevent contaminant short-circuiting into unconfined aquifers.
              </div>
              <div>
                <strong className="text-[#1B3A6B]">48-Hour Drain-Down Window:</strong> Storage is sized to evacuate within 48 hours to prevent standing water and mosquito vector breeding.
              </div>
            </div>
          </div>

          {/* Statutory Legal Statement */}
          <div className="pt-3 border-t border-[#DDD6C8] text-[#3B5988] text-xs space-y-1">
            <span className="font-serif font-bold text-[#1B3A6B] block">
              Statutory Engineering Screening Statement (PRD §8)
            </span>
            <p className="leading-relaxed italic font-serif">
              “Screening-level estimate. Needs site survey, infiltration test and professional hydrogeological review before construction. A 30m DEM cannot see micro-gutters or kerb geometry; gravity reachability must be confirmed on-site before civil excavation.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
