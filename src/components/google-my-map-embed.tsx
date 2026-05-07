const PARIS_FOOD_MAP_EMBED_URL =
  "https://www.google.com/maps/d/embed?mid=1dT1mFuWDWtS1aRSVhwfkN8Ui1KLsel0&ll=48.857697357510006%2C2.337815754370096&z=14";

type GoogleMyMapEmbedProps = {
  className?: string;
};

export function GoogleMyMapEmbed({ className = "" }: GoogleMyMapEmbedProps) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[var(--line)] bg-white/86 ${className}`}>
      <iframe
        title="Paris Food Map on Google My Maps"
        src={PARIS_FOOD_MAP_EMBED_URL}
        className="h-full min-h-[720px] w-full"
        loading="lazy"
      />
    </div>
  );
}
