type ShopImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ShopImage({ src, alt, className }: ShopImageProps) {
  return (
    // Uploads are served from our own media route; the browser loads them directly.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
