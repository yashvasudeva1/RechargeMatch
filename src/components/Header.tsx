import React from 'react';
import { Download, Plus, CloudRain, ChevronDown } from 'lucide-react';
import { StormEvent } from '../types/hydrology';

interface HeaderProps {
  activeTab: 'landing' | 'map' | 'build-list' | 'tests' | 'validation';
  setActiveTab: (tab: 'landing' | 'map' | 'build-list' | 'tests' | 'validation') => void;
  activeStorm: StormEvent;
  onOpenStormSelector: () => void;
  onOpenReportModal: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenStormSelector,
  onOpenReportModal,
  onExportCsv,
}) => {
  const navItems: { id: 'landing' | 'map' | 'build-list' | 'tests' | 'validation'; label: string }[] = [
    { id: 'landing', label: 'Overview' },
    { id: 'map', label: 'Siting Map' },
    { id: 'build-list', label: 'Priority Ledger' },
    { id: 'tests', label: 'Verification' },
    { id: 'validation', label: 'Peer Review' },
  ];

  return (
    <header className="border-b border-[#E2DDD0] bg-[#FAF8F3]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setActiveTab('landing')}
            className="text-left cursor-pointer flex items-center"
          >
            <span className="font-serif text-[20px] sm:text-[25px] font-bold tracking-tight text-[#0F2D59] leading-none">
              RechargeMatch
            </span>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full text-[14px] lg:text-[14.5px]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`h-full flex items-center transition-colors border-b-[2.5px] font-sans whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'border-[#43532B] text-[#0F2D59] font-semibold'
                  : 'border-transparent text-[#4A6588] hover:text-[#0F2D59]'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onOpenStormSelector}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-[#FAF8F3] bg-[#43532B] hover:bg-[#364422] rounded-lg transition-colors cursor-pointer"
            title="Switch storm scenario or replay historical deluge"
          >
            <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FAF8F3] shrink-0" />
            <span className="hidden sm:inline">South Delhi Ward 142</span>
            <span className="sm:hidden">Ward 142</span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FAF8F3]/80 shrink-0" />
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold text-[#0F2D59] bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#9AA690] rounded-lg transition-all whitespace-nowrap active:translate-y-px cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#43532B] shrink-0" />
            <span className="hidden xs:inline sm:inline">Report Spot</span>
            <span className="xs:hidden sm:hidden">Report</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-2.5 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold text-[#FAF8F3] bg-[#43532B] hover:bg-[#364422] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Export ranked build list and assumptions to CSV"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FAF8F3] shrink-0" />
            <span className="hidden lg:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="md:hidden border-t border-[#E2DDD0] bg-[#F3EFE6] px-3 py-1.5 flex items-center justify-start sm:justify-between text-xs overflow-x-auto gap-1.5 font-sans">
        {navItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#43532B] text-[#FAF8F3] font-semibold'
                : 'text-[#3B5988] hover:text-[#0F2D59]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
