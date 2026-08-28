import React, { useState } from 'react';

interface AdaptiveCharacterImageProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  maxHeight?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  fallbackIcon?: React.ReactNode;
}

export const AdaptiveCharacterImage: React.FC<AdaptiveCharacterImageProps> = ({
  src,
  alt = '캐릭터 삽화',
  className = '',
  containerClassName = '',
  maxHeight = 'max-h-[55vh]',
  children,
  onClick,
  onError,
  referrerPolicy = 'no-referrer',
  fallbackIcon,
}) => {
  const [imageAspect, setImageAspect] = useState<'landscape' | 'square' | 'portrait'>('square');

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1.25) {
        setImageAspect('landscape');
      } else if (ratio >= 0.8) {
        setImageAspect('square');
      } else {
        setImageAspect('portrait');
      }
    }
  };

  const aspectClass =
    imageAspect === 'landscape'
      ? 'aspect-[16/9]'
      : imageAspect === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-square';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-amber-900/40 bg-stone-950 shadow-inner ${containerClassName}`}
      onClick={onClick}
    >
      <div
        className={`w-full ${aspectClass} ${maxHeight} bg-stone-950 flex items-center justify-center overflow-hidden transition-all duration-300`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            onLoad={handleImageLoad}
            onError={onError}
            referrerPolicy={referrerPolicy}
            className={`w-full h-full object-contain object-center select-none ${className}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-amber-500/40 p-4">
            {fallbackIcon}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
