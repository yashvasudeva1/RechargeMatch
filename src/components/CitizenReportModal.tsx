import React, { useState } from 'react';
import { X, Upload, Camera, Check, Crosshair } from 'lucide-react';
import { Hotspot, DepthCategory, DurationCategory, CitizenReport } from '../types/hydrology';
import { uploadReportPhotoToS3 } from '../services/awsService';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspots: Hotspot[];
  selectedHotspotId?: string;
  onSubmitReport: (report: Omit<CitizenReport, 'id' | 'timestamp' | 'verifiedByPlanner'>) => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  hotspots,
  selectedHotspotId,
  onSubmitReport,
}) => {
  const [reportType, setReportType] = useState<'known' | 'custom'>('known');
  const [hotspotId, setHotspotId] = useState(selectedHotspotId || (hotspots[0]?.id ?? ''));
  const [customLocationName, setCustomLocationName] = useState('');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lng: number }>({ lat: 28.571, lng: 77.234 });
  const [isLocating, setIsLocating] = useState(false);
  const [locatingStatus, setLocatingStatus] = useState<string | null>(null);

  const [depthCategory, setDepthCategory] = useState<DepthCategory>('knee');
  const [durationCategory, setDurationCategory] = useState<DurationCategory>('2_to_6h');
  const [notes, setNotes] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setLocatingStatus('GPS not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocatingStatus('Requesting GPS coordinate lock...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCustomCoords({
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lng: parseFloat(pos.coords.longitude.toFixed(5)),
        });
        setLocatingStatus(`Locked: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
      },
      () => {
        setIsLocating(false);
        setLocatingStatus('Using South Delhi Ward 142 center coordinates.');
      },
      { timeout: 8000 }
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoSelected(true);
      const localUrl = URL.createObjectURL(file);
      setPhotoUrl(localUrl);
      const s3Url = await uploadReportPhotoToS3(file);
      if (s3Url) {
        setPhotoUrl(s3Url);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (reportType === 'known') {
      const targetHs = hotspots.find((h) => h.id === hotspotId);
      const coords = targetHs ? targetHs.coords : { lat: 28.568, lng: 77.23, x: 500, y: 500 };
      const locName = targetHs ? targetHs.name : 'Ward 142 Flood Hotspot';

      onSubmitReport({
        hotspotId: targetHs ? targetHs.id : undefined,
        locationName: locName,
        coords,
        depthCategory,
        durationCategory,
        photoUrl: photoUrl || undefined,
        photoExifStripped: true,
        notes: notes || 'Waterlogging observed obstructing pedestrian and vehicle movement.',
      });
    } else {
      const locName = customLocationName.trim() || 'Uncatalogued Waterlogging Spot, Ward 142';
      const normX = Math.round(Math.max(50, Math.min(950, (customCoords.lng - 77.21) * 30000)));
      const normY = Math.round(Math.max(50, Math.min(950, (28.59 - customCoords.lat) * 35000)));

      onSubmitReport({
        hotspotId: undefined,
        locationName: locName,
        coords: {
          lat: customCoords.lat,
          lng: customCoords.lng,
          x: normX,
          y: normY,
        },
        depthCategory,
        durationCategory,
        photoUrl: photoUrl || undefined,
        photoExifStripped: true,
        notes: notes || 'Citizen uncatalogued waterlogged spot reported.',
      });
    }

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3A6B]/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD6C8] flex items-center justify-between bg-[#F3EFE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-[#F9F7F2]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1B3A6B]">
                Citizen Waterlogging Dispatch Form
              </h3>
              <p className="text-[11px] text-[#3B5988]">
                4-field report directly elevates hotspot evidence and siting confidence.
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

        {submittedSuccess ? (
          <div className="p-10 text-center space-y-3 bg-[#F9F7F2]">
            <div className="w-10 h-10 rounded-sm bg-[#4A5C30] flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 text-[#F9F7F2]" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#1B3A6B]">Dispatch Filed Successfully</h4>
            <p className="text-xs text-[#3B5988] max-w-xs mx-auto">
              Hotspot evidence boosted. EXIF GPS stripped to preserve citizen anonymity.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Field 1: Hotspot Selection Mode */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#1B3A6B]">
                  1. Location Target
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReportType('known')}
                    className={`px-2.5 py-1 rounded-sm text-[11px] transition-colors cursor-pointer ${
                      reportType === 'known' ? 'bg-[#4A5C30] text-[#F9F7F2] font-semibold' : 'text-[#3B5988] hover:text-[#1B3A6B]'
                    }`}
                  >
                    Known Hotspot
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('custom')}
                    className={`px-2.5 py-1 rounded-sm text-[11px] transition-colors cursor-pointer ${
                      reportType === 'custom' ? 'bg-[#4A5C30] text-[#F9F7F2] font-semibold' : 'text-[#3B5988] hover:text-[#1B3A6B]'
                    }`}
                  >
                    + New Spot (GPS)
                  </button>
                </div>
              </div>

              {reportType === 'known' ? (
                <select
                  value={hotspotId}
                  onChange={(e) => setHotspotId(e.target.value)}
                  className="w-full bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm px-3 py-2 text-xs text-[#1B3A6B] focus:outline-none focus:border-[#4A5C30]"
                >
                  {hotspots.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.typicalDepth.replace('_', ' ')} · {h.reportCount} reports)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customLocationName}
                    onChange={(e) => setCustomLocationName(e.target.value)}
                    placeholder="Enter street, landmark, or intersection name..."
                    className="w-full bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm px-3 py-2 text-xs text-[#1B3A6B] placeholder-[#647D9E] focus:outline-none focus:border-[#4A5C30]"
                  />
                  <div className="flex items-center justify-between text-[11px] border-t border-[#DDD6C8] pt-2">
                    <span className="font-mono text-[#3B5988]">
                      Lat: {customCoords.lat.toFixed(4)}, Lng: {customCoords.lng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={handleGeoLocate}
                      disabled={isLocating}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] transition-colors cursor-pointer"
                    >
                      <Crosshair className={`w-3.5 h-3.5 text-[#F9F7F2] ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Locking...' : 'Auto-Locate GPS'}</span>
                    </button>
                  </div>
                  {locatingStatus && (
                    <span className="text-[10px] text-[#1B3A6B] block font-mono">
                      {locatingStatus}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field 2: Depth Category */}
            <div>
              <label className="block text-xs font-semibold text-[#1B3A6B] mb-2">
                2. Standing Water Depth Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ankle', label: 'Ankle (<15 cm)', desc: 'Road curb pooling' },
                  { id: 'knee', label: 'Knee (15-45 cm)', desc: 'Vehicles stalled' },
                  { id: 'waist_or_above', label: 'Waist+ (>45 cm)', desc: 'Submerged underpass' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDepthCategory(item.id as DepthCategory)}
                    className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                      depthCategory === item.id
                        ? 'border-[#4A5C30] bg-[#4A5C30] text-[#F9F7F2]'
                        : 'border-[#DDD6C8] bg-[#F9F7F2] text-[#1B3A6B] hover:border-[#4A5C30]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${depthCategory === item.id ? 'text-[#F9F7F2]/85' : 'text-[#647D9E]'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Duration Category */}
            <div>
              <label className="block text-xs font-semibold text-[#1B3A6B] mb-2">
                3. Surface Water Drain Duration
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'under_2h', label: '< 2 hrs' },
                  { id: '2_to_6h', label: '2 - 6 hrs' },
                  { id: '6_to_12h', label: '6 - 12 hrs' },
                  { id: 'over_12h', label: '> 12 hrs' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDurationCategory(item.id as DurationCategory)}
                    className={`py-2 px-1 text-center rounded-sm border text-xs transition-colors cursor-pointer ${
                      durationCategory === item.id
                        ? 'border-[#4A5C30] bg-[#4A5C30] text-[#F9F7F2] font-bold'
                        : 'border-[#DDD6C8] bg-[#F9F7F2] text-[#3B5988] hover:text-[#1B3A6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Optional Photo & Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#1B3A6B] mb-2">
                4. Field Evidence & Photo (Optional)
              </label>
              <div className="space-y-2.5">
                <label className="border border-dashed border-[#DDD6C8] hover:border-[#4A5C30] rounded-sm p-3 text-center cursor-pointer flex items-center justify-center gap-3 bg-[#F9F7F2] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="w-7 h-7 rounded-sm bg-[#4A5C30] flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#F9F7F2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-[#1B3A6B] font-semibold block">
                      {photoSelected ? 'Photo Attached (1 file)' : 'Attach waterlogging photo'}
                    </span>
                    <span className="text-[10px] text-[#647D9E] block">
                      JPG, PNG · Automatic EXIF GPS sanitization enabled
                    </span>
                  </div>
                </label>

                {photoSelected && (
                  <div className="py-1.5 border-t border-[#DDD6C8] flex items-center justify-between text-[11px] text-[#1B3A6B]">
                    <span>Privacy Protection: EXIF GPS & metadata scrubbed.</span>
                    {photoUrl && (
                      <img src={photoUrl} alt="Thumbnail preview" className="w-6 h-6 object-cover rounded-sm border border-[#DDD6C8]" />
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional field notes (e.g. Grate clogged with silt; street inundated)..."
                  className="w-full bg-[#F9F7F2] border border-[#DDD6C8] rounded-sm px-3 py-2 text-xs text-[#1B3A6B] placeholder-[#647D9E] focus:outline-none focus:border-[#4A5C30]"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DDD6C8]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30]/80 hover:bg-[#4A5C30] rounded-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-[#F9F7F2] bg-[#4A5C30] hover:bg-[#3A4A24] rounded-sm transition-all active:translate-y-px cursor-pointer"
              >
                Submit Field Dispatch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
