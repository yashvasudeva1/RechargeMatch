import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StormEvent } from '../types/hydrology';

interface LandingPageProps {
  onLaunchPlanner: () => void;
  onViewBuildList: () => void;
  onViewTests: () => void;
  onOpenDemoScript: () => void;
  activeStorm: StormEvent;
  wardSummary: {
    totalRunoffM3: { low: number; base: number; high: number };
    totalCapturedM3: { low: number; base: number; high: number };
    totalRechargedM3: { low: number; base: number; high: number };
    wardAbsorptionGapM3: { low: number; base: number; high: number };
    absorptionPercentage: number;
    recommendedStructuresCount: number;
    detentionOnlyStructuresCount: number;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchPlanner,
  onViewBuildList,
}) => {
  return (
    <section className="relative w-full min-h-[calc(100vh-92px)] lg:h-[calc(100vh-64px)] lg:max-h-[calc(100vh-64px)] flex items-center overflow-y-auto lg:overflow-hidden bg-[#FAF7EF] select-none font-sans">
      {/* 1. Full-Bleed Background Topographic Contours, Faint Urban Grid & Bottom Skyline/Foliage */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 820"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="river-tint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BFD4E6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#9AB9D4" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="skyline-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DDD6C3" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C9C0AA" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Subtle Left-Side Topographic Contour Lines */}
        <g fill="none" stroke="#EBE4D3" strokeWidth="1.2">
          <path d="M -40 120 C 120 140, 220 260, 140 420 C 60 580, 180 700, 340 820" />
          <path d="M -40 60 C 180 90, 290 230, 210 410 C 130 590, 260 710, 430 820" />
          <path d="M 40 -20 C 250 40, 360 200, 290 400 C 220 600, 350 720, 520 820" />
          <path d="M 460 660 C 530 610, 620 630, 670 700 C 720 770, 680 830, 610 850" />
          <path d="M 430 690 C 510 580, 640 600, 700 690 C 750 760, 710 830, 640 860" />
        </g>

        {/* Faint Background Cartographic Street Network on Right Half */}
        <g fill="none" stroke="#EAE3D3" strokeWidth="1">
          <line x1="680" y1="0" x2="540" y2="820" />
          <line x1="780" y1="0" x2="620" y2="820" />
          <line x1="890" y1="0" x2="730" y2="820" />
          <line x1="1020" y1="0" x2="840" y2="820" />
          <line x1="1160" y1="0" x2="960" y2="820" />
          <line x1="1300" y1="0" x2="1120" y2="820" />
          <line x1="580" y1="120" x2="1440" y2="310" />
          <line x1="550" y1="260" x2="1440" y2="460" />
          <line x1="520" y1="410" x2="1440" y2="620" />
          <line x1="490" y1="560" x2="1440" y2="750" />
          <path d="M 640 0 Q 820 260 1440 180" strokeWidth="2.5" stroke="#E5DEC9" />
          <path d="M 520 480 Q 920 340 1440 520" strokeWidth="2" stroke="#E5DEC9" />
        </g>

        {/* Faint Background Green Urban Blocks Outside Ward */}
        <g fill="#DDE3CE" fillOpacity="0.45">
          <polygon points="780,140 830,120 845,175 795,190" />
          <polygon points="1220,260 1290,235 1315,310 1240,330" />
          <polygon points="1340,390 1420,370 1435,450 1355,465" />
          <polygon points="735,480 785,465 800,520 750,535" />
        </g>

        {/* Yamuna / Barapullah River Channel Sweeping Down the Right */}
        <path
          d="M 1030 -20 C 1070 90, 1150 210, 1235 315 C 1320 420, 1365 550, 1395 720 L 1435 720 C 1405 540, 1355 400, 1265 290 C 1180 185, 1105 70, 1065 -20 Z"
          fill="url(#river-tint)"
        />

        {/* Delhi Architectural Skyline Silhouette (India Gate & Heritage Domes at Bottom Right) */}
        <g fill="url(#skyline-fade)">
          <rect x="690" y="745" width="45" height="65" />
          <rect x="742" y="732" width="58" height="78" />
          <rect x="808" y="750" width="38" height="60" />
          <rect x="852" y="738" width="52" height="72" />
          <path d="M 930 750 Q 955 715 980 750 L 980 810 L 930 810 Z" />
          <rect x="990" y="742" width="65" height="68" />
          <path d="M 1085 745 Q 1115 705 1145 745 L 1145 810 L 1085 810 Z" />
          <rect x="1155" y="735" width="70" height="75" />

          {/* India Gate Monument Silhouette */}
          <g transform="translate(1255, 645)">
            <rect x="12" y="0" width="76" height="10" />
            <rect x="6" y="10" width="88" height="14" />
            <rect x="0" y="24" width="100" height="140" />
            <path d="M 28 164 L 28 78 A 22 22 0 0 1 72 78 L 72 164 Z" fill="#FAF7EF" fillOpacity="0.8" />
          </g>
        </g>

        {/* Muted Back Layer Foliage */}
        <g fill="#9DA686" fillOpacity="0.45">
          <circle cx="25" cy="760" r="55" />
          <circle cx="95" cy="785" r="48" />
          <circle cx="170" cy="795" r="42" />
          <circle cx="660" cy="795" r="38" />
          <circle cx="725" cy="785" r="45" />
          <circle cx="810" cy="780" r="52" />
          <circle cx="910" cy="785" r="48" />
          <circle cx="1020" cy="780" r="55" />
          <circle cx="1140" cy="775" r="50" />
          <circle cx="1390" cy="730" r="65" />
          <circle cx="1430" cy="670" r="55" />
        </g>

        {/* Deep Olive Foreground Botanical Foliage */}
        <g fill="#4A5A32" fillOpacity="0.88">
          <circle cx="-10" cy="795" r="52" />
          <circle cx="55" cy="810" r="46" />
          <circle cx="125" cy="820" r="38" />
          <circle cx="710" cy="815" r="42" />
          <circle cx="775" cy="805" r="50" />
          <circle cx="855" cy="800" r="56" />
          <circle cx="945" cy="810" r="48" />
          <circle cx="1035" cy="800" r="58" />
          <circle cx="1125" cy="805" r="52" />
          <circle cx="1215" cy="810" r="45" />
          <circle cx="1305" cy="812" r="44" />
          <circle cx="1385" cy="785" r="62" />
          <circle cx="1435" cy="740" r="58" />
        </g>
      </svg>

      {/* 2. Main 2-Column Content Container Balanced for Single Screen & Mobile */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Editorial Typography & Action Buttons */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
          {/* Overline with Olive Rule */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <span className="w-6 sm:w-8 h-[1.5px] bg-[#8C856B] inline-block shrink-0" />
            <span className="text-[10.5px] sm:text-xs font-sans uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#566F8E] font-medium">
              South Delhi Ward 142 &nbsp;·&nbsp; Hydrological Siting Engine
            </span>
          </div>

          {/* Two-Part Serif Headline */}
          <h1 className="font-serif tracking-tight">
            <span className="block text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-bold text-[#0D2B54] leading-[1.08] sm:leading-[1.06]">
              Delhi already knows
              <br />
              where it floods.
            </span>
            <span className="block text-2xl sm:text-4xl lg:text-[43px] xl:text-[46px] font-normal italic text-[#163B6E] leading-[1.15] sm:leading-[1.13] mt-2 sm:mt-2.5">
              RechargeMatch shows where
              <br />
              that water should go.
            </span>
          </h1>

          {/* Lead Paragraph */}
          <p className="text-xs sm:text-[16px] text-[#3B5474] max-w-[540px] leading-[1.6] sm:leading-[1.64] font-normal pt-0.5 sm:pt-1">
            An empirical civil planning tool for Delhi's drainage wards. It routes overland storm runoff by gravity from chronic flood origins to downhill parks and institutional grounds - calculating real retention capacity and soil infiltration bounds before monsoons arrive.
          </p>

          {/* Action Buttons */}
          <div className="pt-1.5 sm:pt-2.5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={onLaunchPlanner}
              className="flex items-center justify-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-[14.5px] font-semibold text-[#FAF8F3] bg-[#1E4477] hover:bg-[#15345E] rounded-lg transition-all cursor-pointer active:translate-y-px"
            >
              <span>Explore Siting Map</span>
              <ArrowRight className="w-4 h-4 text-[#FAF8F3]" />
            </button>

            <button
              onClick={onViewBuildList}
              className="flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-[14.5px] font-semibold text-[#0F2D59] bg-[#FAF8F3]/90 hover:bg-[#EFECE1] border border-[#7E95B4] rounded-lg transition-all cursor-pointer active:translate-y-px"
            >
              <span>View Priority Ledger</span>
            </button>
          </div>
        </div>

        {/* Right Column: Ward 142 Cartographic Map Illustration & Legend */}
        <div className="lg:col-span-6 relative flex flex-col sm:flex-row items-center justify-center">
          {/* Interactive Ward 142 Vector Map SVG */}
          <svg
            viewBox="0 0 680 620"
            className="w-full max-w-[380px] sm:max-w-[550px] xl:max-w-[600px] max-h-[48vh] sm:max-h-[82vh] h-auto overflow-visible cursor-pointer"
            onClick={onLaunchPlanner}
          >
            <defs>
              <clipPath id="ward-142-clip">
                <polygon points="185,78 275,45 292,102 355,95 362,155 435,148 442,218 422,232 458,318 432,338 565,455 512,508 525,535 498,582 442,508 388,522 335,452 248,402 182,368 118,302 155,235 142,202 198,142" />
              </clipPath>

              <marker
                id="gravity-arrow"
                markerWidth="7"
                markerHeight="7"
                refX="5"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0.5, 6.5 3.5, 0 6.5" fill="#1E4477" />
              </marker>

              <filter id="ward-shadow" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#3A3528" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* Ward 142 Clipped Interior */}
            <g clipPath="url(#ward-142-clip)" filter="url(#ward-shadow)">
              <rect x="80" y="30" width="520" height="580" fill="#F4EFE2" />

              {/* Green Park & Open Ground Parcels Inside Ward 142 */}
              <polygon points="195,90 255,75 268,135 210,145" fill="#D5DEC2" />
              <polygon points="295,115 352,105 360,175 305,185" fill="#C4D3AE" />
              <polygon points="365,165 432,155 438,235 372,245" fill="#B8C99E" />
              <polygon points="145,245 225,220 245,295 165,315" fill="#CFD9BA" />
              <polygon points="270,225 325,210 338,265 282,278" fill="#9BB282" />
              <polygon points="345,255 425,240 448,335 365,355" fill="#C4D3AE" />
              <polygon points="215,315 305,295 335,385 245,400" fill="#D5DEC2" />
              <polygon points="355,365 465,345 535,465 425,515" fill="#B2C596" />
              <polygon points="440,475 518,455 522,555 455,565" fill="#9BB282" />

              {/* Internal Ward Street & Colony Grid Lines */}
              <g stroke="#E3DCCB" strokeWidth="1.2" fill="none">
                <line x1="120" y1="150" x2="520" y2="90" />
                <line x1="120" y1="210" x2="520" y2="150" />
                <line x1="120" y1="270" x2="520" y2="210" />
                <line x1="120" y1="330" x2="540" y2="270" />
                <line x1="150" y1="390" x2="560" y2="330" />
                <line x1="220" y1="450" x2="560" y2="395" />
                <line x1="210" y1="50" x2="160" y2="420" />
                <line x1="270" y1="50" x2="220" y2="440" />
                <line x1="330" y1="60" x2="285" y2="480" />
                <line x1="390" y1="90" x2="355" y2="520" />
                <line x1="450" y1="120" x2="435" y2="560" />
              </g>

              {/* Soft Blue Retention Basin / Water Body in Lower Sink */}
              <path
                d="M 412 405 C 435 398, 462 415, 468 438 C 474 460, 452 478, 428 472 C 402 465, 390 442, 396 420 C 400 410, 405 407, 412 405 Z"
                fill="#7AA4CE"
                fillOpacity="0.82"
                stroke="#4D7FB3"
                strokeWidth="1"
              />

              {/* Gravity Runoff Flow Paths */}
              <g fill="none">
                <path
                  d="M 225 95 C 245 140, 265 165, 290 190 C 335 235, 360 285, 385 355 C 392 375, 398 395, 402 410"
                  stroke="#BFD4E8"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M 225 95 C 245 140, 265 165, 290 190"
                  stroke="#2B5B94"
                  strokeWidth="1.8"
                  strokeDasharray="5,4"
                  markerEnd="url(#gravity-arrow)"
                />
                <path
                  d="M 295 195 C 338 238, 362 285, 382 345"
                  stroke="#1E4477"
                  strokeWidth="2.2"
                  markerEnd="url(#gravity-arrow)"
                />

                <path
                  d="M 155 275 C 205 282, 240 298, 275 322 C 315 348, 355 355, 382 392"
                  stroke="#BFD4E8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 155 275 C 200 282, 232 294, 258 310"
                  stroke="#2B5B94"
                  strokeWidth="1.8"
                  strokeDasharray="5,4"
                  markerEnd="url(#gravity-arrow)"
                />
                <path
                  d="M 278 324 C 318 348, 352 355, 378 388"
                  stroke="#1E4477"
                  strokeWidth="2.2"
                  markerEnd="url(#gravity-arrow)"
                />

                <path
                  d="M 255 185 C 242 235, 255 275, 295 312 C 332 345, 368 360, 390 400"
                  stroke="#1E4477"
                  strokeWidth="1.8"
                  strokeDasharray="6,4"
                  markerEnd="url(#gravity-arrow)"
                />

                <path
                  d="M 355 415 C 382 442, 395 478, 392 518"
                  stroke="#1E4477"
                  strokeWidth="2.2"
                  markerEnd="url(#gravity-arrow)"
                />
              </g>
            </g>

            {/* Ward 142 Outer & Inner Boundary Strokes */}
            <polygon
              points="185,78 275,45 292,102 355,95 362,155 435,148 442,218 422,232 458,318 432,338 565,455 512,508 525,535 498,582 442,508 388,522 335,452 248,402 182,368 118,302 155,235 142,202 198,142"
              fill="none"
              stroke="#43532B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="185,78 275,45 292,102 355,95 362,155 435,148 442,218 422,232 458,318 432,338 565,455 512,508 525,535 498,582 442,508 388,522 335,452 248,402 182,368 118,302 155,235 142,202 198,142"
              fill="none"
              stroke="#1E4477"
              strokeWidth="1"
              strokeDasharray="5,4"
              strokeOpacity="0.5"
            />

            {/* Marker 1: Upper Potential Recharge Site (Deep Olive) */}
            <g transform="translate(292, 182)">
              <circle r="16" fill="#43532B" fillOpacity="0.18" />
              <circle r="11" fill="#43532B" stroke="#FAF8F3" strokeWidth="2.5" />
            </g>

            {/* Marker 2: Mid-West Potential Recharge Site (Deep Olive) */}
            <g transform="translate(264, 314)">
              <circle r="16" fill="#43532B" fillOpacity="0.18" />
              <circle r="11" fill="#43532B" stroke="#FAF8F3" strokeWidth="2.5" />
            </g>

            {/* Marker 3: Lower-South Potential Recharge Site (Deep Olive) */}
            <g transform="translate(448, 492)">
              <circle r="15" fill="#43532B" fillOpacity="0.18" />
              <circle r="10.5" fill="#43532B" stroke="#FAF8F3" strokeWidth="2.5" />
            </g>

            {/* Primary Retention Park / Ground Marker (Cobalt Blue with Outer Ring) */}
            <g transform="translate(398, 418)">
              <circle r="20" fill="#1E4477" fillOpacity="0.18" stroke="#1E4477" strokeWidth="1.2" />
              <circle r="13.5" fill="#183B6B" stroke="#FAF8F3" strokeWidth="2.5" />
            </g>
          </svg>

          {/* Balanced Top-Right Legend Box (Stacks cleanly on mobile, floats top-right on sm+) */}
          <div className="relative sm:absolute mt-2 sm:mt-0 sm:top-2 sm:right-2 w-full sm:w-auto bg-[#FAF8F3]/95 backdrop-blur-xs border border-[#E4DFD2] rounded-xl px-4 sm:px-5 py-3 sm:py-4 grid grid-cols-2 sm:block gap-2.5 sm:space-y-2.5 text-xs sm:text-[12.5px] text-[#1B3A6B]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#43532B] border-2 border-[#FAF8F3] ring-1 ring-[#43532B]/40 shrink-0" />
              <span className="text-[#2C4566] font-medium">Potential Recharge Site</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#183B6B] border-2 border-[#FAF8F3] ring-1 ring-[#183B6B] shrink-0" />
              <span className="text-[#2C4566] font-medium">Retention Park / Ground</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <svg className="w-5 h-3.5 shrink-0" viewBox="0 0 24 12">
                <line x1="0" y1="6" x2="18" y2="6" stroke="#1E4477" strokeWidth="1.8" />
                <polygon points="16,2.5 22,6 16,9.5" fill="#1E4477" />
              </svg>
              <span className="text-[#2C4566] font-medium">Runoff Route (Gravity)</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <svg className="w-5 h-3.5 shrink-0" viewBox="0 0 24 12">
                <line x1="0" y1="6" x2="22" y2="6" stroke="#3B5988" strokeWidth="1.6" strokeDasharray="3.5,2.5" />
              </svg>
              <span className="text-[#2C4566] font-medium">Ward Boundary</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
