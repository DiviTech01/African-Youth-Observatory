import React from 'react';
import { useContent } from '@/contexts/ContentContext';

interface ContentImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** CMS key for this image, e.g. "home.hero.bg" */
  id: string;
  /** Fallback src used when no CMS image has been uploaded */
  fallback: string;
  alt: string;
}

export const ContentImage: React.FC<ContentImageProps> = ({ id, fallback, alt, ...rest }) => {
  const entry = useContent(id);
  const src = entry?.imageUrl ?? fallback;
  return <img {...rest} src={src} alt={alt} data-cms-id={id} />;
};

export default ContentImage;
