import React, { useState } from 'react';
import { X, Play, ArrowRight } from 'lucide-react';

interface DemoScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHotspotById: (id: string) => void;
  onSelectStormById: (id: string) => void;
  onSwitchTab: (tab: 'map' | 'build-list' | 'tests' | 'validation') => void;
}

export const DemoScriptModal: React.FC<DemoScriptModalProps> = ({
  isOpen,
  onClose,
  onSelectHotspotById,
  onSelectStormById,
  onSwitchTab,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Hook (20s): The Twin Failure of Indian Cities',
      duration: '20 seconds',
      speech:
        'In July, Moolchand Underpass and Ring Road are waist-deep in water. By May, the exact same neighbourhood is lining up for private water tankers because borewells are dry. Same neighbourhood. Same year. Indian cities don’t have a water scarcity problem - they have a water routing failure.',
      actionLabel: 'Focus Ward Plan',
      action: () => {
        onSwitchTab('map');
      },
    },
    {
      num: 2,
      title: 'Insight (25s): We Know Where It Floods. Where Should It Go?',
      duration: '25 seconds',
      speech:
        'Municipal authorities already have lists of chronic waterlogging spots. What was missing is a physics-aware tool that routes that water by gravity to nearby open spaces, reports honest infiltration limits, and reveals the absorption gap.',
      actionLabel: 'Select Moolchand Underpass Hotspot',
      action: () => {
        onSwitchTab('map');
        onSelectHotspotById('hs-1');
      },
    },
    {
      num: 3,
      title: 'Walkthrough: Upstream Catchment & Gravity Matching',
      duration: '35 seconds',
      speech:
        'Notice Moolchand Underpass: a 38,000 m² paved catchment generating over 2,000 m³ of runoff in a standard storm. RechargeMatch computes the flow path and ranks Defence Colony C-Block District Park #1 - it is downhill by 1.3 meters with sandy loam soil and a 14.5m unsaturated zone.',
      actionLabel: 'Inspect Downhill Match #1',
      action: () => {
        onSwitchTab('map');
        onSelectHotspotById('hs-1');
      },
    },
    {
      num: 4,
      title: 'Walkthrough: The Uphill Rejection Constraint',
      duration: '25 seconds',
      speech:
        'Here is where naive distance algorithms fail: Moolchand Hospital is only 400m away, but it sits 1.6m higher in elevation. Water cannot flow uphill without diesel pumps! RechargeMatch enforces this hard physical constraint and rejects it.',
      actionLabel: 'Show Rejected Uphill Filter',
      action: () => {
        onSwitchTab('map');
        onSelectHotspotById('hs-1');
      },
    },
    {
      num: 5,
      title: 'Walkthrough: Safety Gate on Kushak Nala',
      duration: '25 seconds',
      speech:
        'Now look at hotspot hs-2 beside Kushak Nala. Recharging untreated sewage-mixed runoff would contaminate drinking water. Our safety gate automatically flags sewage proximity and downgrades the site to surface detention only - zero direct aquifer recharge.',
      actionLabel: 'Inspect Kushak Nala Hotspot (hs-2)',
      action: () => {
        onSwitchTab('map');
        onSelectHotspotById('hs-2');
      },
    },
    {
      num: 6,
      title: 'Walkthrough: Storm Replay & Absorption Gap',
      duration: '30 seconds',
      speech:
        'Let’s replay the historic June 28, 2024 deluge of 228 mm. The app updates in milliseconds. Notice we report honest numbers: even after our structures capture 12,000 m³, an absorption gap of 29,000 m³ remains. Showing the gap gives engineers the honest truth.',
      actionLabel: 'Replay June 28, 2024 Storm (228 mm)',
      action: () => {
        onSelectStormById('storm-real-2024-06-28');
        onSwitchTab('build-list');
      },
    },
    {
      num: 7,
      title: 'Validation & Tech (30s): Expert Agreement & Verification',
      duration: '30 seconds',
      speech:
        'We validated our algorithm against independent blind rankings by Delhi Jal Board and IIT Delhi hydrologists: 93% overlap across 10 hotspots, reporting misses honestly. Automated test suite verifies zero uphill recommendations on every run.',
      actionLabel: 'Show Expert Back-Test & Unit Tests',
      action: () => {
        onSwitchTab('validation');
      },
    },
    {
      num: 8,
      title: 'Close (10s): The Takeaway',
      duration: '10 seconds',
      speech:
        'Waterlogging lasts hours, but hotspots recur every single year. A ward that knows its absorption gap can close it before the next monsoon.',
      actionLabel: 'View Ranked Build List',
      action: () => {
        onSwitchTab('build-list');
      },
    },
  ];

  const activeStepObj = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3A6B]/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD6C8] flex items-center justify-between bg-[#F3EFE6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 text-[#F9F7F2]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1B3A6B]">
                3-Minute Demo Walkthrough Script (PRD Section 13)
              </h3>
              <p className="text-[11px] text-[#3B5988]">
                Step-by-step presentation narrative with automated live application state triggers.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step Selector Buttons */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[#DDD6C8] text-xs">
            {steps.map((s) => (
              <button
                key={s.num}
                onClick={() => {
                  setCurrentStep(s.num);
                  s.action();
                }}
                className={`px-3 py-1.5 rounded-sm text-xs whitespace-nowrap transition-colors font-semibold cursor-pointer ${
                  currentStep === s.num
                    ? 'bg-[#4A5C30] text-[#F9F7F2]'
                    : 'bg-[#F3EFE6] text-[#3B5988] hover:text-[#1B3A6B]'
                }`}
              >
                Step {s.num}
              </button>
            ))}
          </div>

          {/* Current Step Monograph View (No Nested Box) */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#647D9E] font-mono uppercase tracking-[0.14em] block font-semibold">
                  {activeStepObj.duration}
                </span>
                <h4 className="font-serif text-lg font-bold text-[#1B3A6B] mt-0.5">{activeStepObj.title}</h4>
              </div>
              <span className="font-mono text-xs text-[#647D9E]">
                {currentStep} / {steps.length}
              </span>
            </div>

            {/* Script Speech */}
            <div className="border-l-2 border-[#4A5C30] pl-4 py-1 text-sm text-[#1B3A6B] leading-relaxed font-serif italic">
              “{activeStepObj.speech}”
            </div>

            {/* Interactive State Trigger Button */}
            <button
              onClick={activeStepObj.action}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
            >
              <span>Trigger Application State: {activeStepObj.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F9F7F2]" />
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#F3EFE6] border-t border-[#DDD6C8] flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (currentStep > 1) {
                const nextStep = currentStep - 1;
                setCurrentStep(nextStep);
                steps[nextStep - 1].action();
              }
            }}
            disabled={currentStep === 1}
            className="px-3.5 py-1.5 rounded-sm font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>

          <span className="text-[11px] text-[#3B5988] hidden sm:inline">
            Step through the sequence to demonstrate full end-to-end functionality
          </span>

          <button
            onClick={() => {
              if (currentStep < steps.length) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                steps[nextStep - 1].action();
              } else {
                onClose();
              }
            }}
            className="px-4 py-1.5 rounded-sm font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] transition-colors cursor-pointer active:translate-y-px"
          >
            {currentStep === steps.length ? 'Complete Walkthrough' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};
