import type { VisionBoardCard } from "@/features/vision-board/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
}

/**
 * Photo strip widget — a small stack of pictures that make the vision
 * feel real. Shows up to four images; the title sits beneath.
 */
export function PhotoStripCard({ card }: Props) {
  const urls = (card.imageUrls ?? []).slice(0, 4);

  return (
    <div className="flex h-full flex-col p-4 @lg:p-5">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
        {urls.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center rounded-xl bg-white/50 text-sm italic opacity-60">
            Add photos…
          </div>
        ) : (
          urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className={`overflow-hidden rounded-lg bg-white/50 ${
                urls.length === 1 ? "col-span-2" : ""
              } ${urls.length === 3 && index === 0 ? "col-span-2" : ""}`}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ))
        )}
      </div>
      <p className="mt-2.5 truncate text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
        {card.emoji ? `${card.emoji} ` : ""}
        {card.title}
      </p>
    </div>
  );
}

export default PhotoStripCard;
