import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  Shield, 
  RefreshCw,
  Camera
} from 'lucide-react';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  displayName: string;
  onSaveAvatar: (avatarUrl: string) => void;
}

// Preset tactical operative avatars (generated SVG-safe data URIs & stylized avatars)
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
];

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  displayName,
  onSaveAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatarUrl || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file upload and compress image for quick storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize to max 400x400 for high quality yet fast load
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedAvatar(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setSelectedAvatar(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleConfirmSave = () => {
    onSaveAvatar(selectedAvatar);
    onClose();
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[#0c1016] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                TACTICAL VISUAL IDENTIFIER
              </span>
              <h2 className="font-display text-2xl font-black text-white uppercase">
                Change Profile Picture
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Live Preview */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="relative w-20 h-20 rounded-2xl border-2 border-cyan-500/50 bg-slate-950 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center overflow-hidden shrink-0">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-display font-black text-3xl flex items-center justify-center">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1 text-left flex-1 min-w-0">
              <span className="font-mono text-xs font-bold text-white block truncate">
                {displayName}
              </span>
              <p className="font-mono text-[11px] text-slate-400">
                {selectedAvatar ? 'Custom operative avatar selected' : 'Default tactical letter emblem'}
              </p>
              {selectedAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="font-mono text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer mt-1"
                >
                  Reset to default initial
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'upload'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Device Image
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'presets'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Preset Avatars
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'url'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Image URL
            </button>
          </div>

          {/* Tab 1: Upload from Device */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  {isProcessing ? 'Processing Image...' : 'Click to Upload Any Picture'}
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-1">
                  Supports JPG, PNG, GIF, WebP. High resolution auto-optimized.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Preset Vanguard Avatars */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-slate-400 uppercase block">
                Select an Official Vanguard Identity:
              </span>
              <div className="grid grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                {PRESET_AVATARS.map((url, idx) => {
                  const isSelected = selectedAvatar === url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 group cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-95'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-3">
              <label className="font-mono text-[10px] text-slate-400 uppercase block">
                Paste Image Link (Web URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-white font-mono text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded transition-colors cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
            </form>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirmSave}
              className="flex-1 py-3 bg-[#f4a261] hover:bg-[#ffb378] text-[#2b1400] font-display font-black text-xs uppercase tracking-wider chamfer-btn transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(244,162,97,0.3)]"
            >
              <Check className="w-4 h-4" /> Save Profile Picture
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs uppercase rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
