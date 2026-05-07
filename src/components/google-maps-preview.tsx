type GoogleMapsPreviewProps = {
  name: string;
  address?: string | null;
  city?: string | null;
  className?: string;
};

function buildEmbedUrl({
  name,
  address,
  city,
}: {
  name: string;
  address?: string | null;
  city?: string | null;
}) {
  const query = [name, address, city].filter(Boolean).join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function GoogleMapsPreview({
  name,
  address,
  city,
  className = "",
}: GoogleMapsPreviewProps) {
  return (
    <div className={`overflow-hidden rounded-[24px] border border-[var(--line)] bg-white/86 ${className}`}>
      <iframe
        title={`Google Maps preview for ${name}`}
        src={buildEmbedUrl({ name, address, city })}
        className="h-full min-h-[280px] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
