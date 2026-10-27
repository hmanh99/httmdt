import React, { useState } from 'react';
import { ProductImage } from '../../types';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeImage = images[selectedIdx] || images[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 items-start">
      {/* Thumbnail Navigation Strip */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[580px] w-full md:w-20 flex-shrink-0">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={img.id || idx}
                onClick={() => setSelectedIdx(idx)}
                className={`relative w-18 h-18 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-100 ${
                  isSelected ? 'border-slate-950 ring-2 ring-slate-950/20' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || `${productName} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Large Viewport */}
      <div className="flex-1 w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
        {activeImage?.image_url ? (
          <img
            src={activeImage.image_url}
            alt={activeImage.alt_text || productName}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            No image available
          </div>
        )}
      </div>
    </div>
  );
};
