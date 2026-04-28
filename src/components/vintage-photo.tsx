import Image from "next/image";

type VintagePhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
  objectPosition?: string;
  label?: string;
  fillClassName?: string;
};

export function VintagePhoto({
  src,
  alt,
  sizes,
  preload = false,
  className = "",
  objectPosition = "center",
  label,
  fillClassName = "",
}: VintagePhotoProps) {
  return (
    <div className={`vintage-photo-shell ${className}`}>
      <div className="vintage-photo-frame">
        <Image
          src={src}
          alt={alt}
          fill
          preload={preload}
          sizes={sizes}
          className={`object-cover vintage-photo-image ${fillClassName}`}
          style={{ objectPosition }}
        />
        <div className="vintage-photo-wash" />
        <div className="vintage-photo-grain" />
        <div className="vintage-photo-border" />
        {label ? (
          <div className="vintage-photo-label">
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
