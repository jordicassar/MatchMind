// TeamSlot — shared sub-component used inside MatchCard and HistoryCard.
// Renders a single team's crest image and name, used twice per card
// to represent the home and away sides of a match.
export default function TeamSlot({ crest, name }: { crest: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <img src={crest ?? undefined} alt={name} className="h-9 w-9 object-contain" />
      <span className="w-full text-center text-[11px] leading-tight text-muted-foreground line-clamp-2">
        {name}
      </span>
    </div>
  );
}
