import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { getCroppedBlob } from '@/lib/cropImage';

export default function CropModal({ image, aspect = 1, title = 'Cắt ảnh', onCancel, onDone }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onComplete = useCallback((_, p) => setPixels(p), []);

  const handleSave = async () => {
    if (!pixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(image, pixels, 'image/jpeg', 0.85);
      const file = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
      await onDone(file);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-3" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 h-12 border-b dark:border-gray-800">
          <h3 className="font-semibold dark:text-white text-sm">{title}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} className="dark:text-gray-300"/></button>
        </div>
        <div className="relative bg-black" style={{ height: 360 }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            objectFit="contain"
          />
        </div>
        <div className="p-4 space-y-3">
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-violet-600" />
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 h-10 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 dark:text-white">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="px-4 h-10 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 flex items-center gap-1.5 disabled:opacity-60">
              <Check size={16}/>{saving ? 'Đang lưu…' : 'Xong'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
