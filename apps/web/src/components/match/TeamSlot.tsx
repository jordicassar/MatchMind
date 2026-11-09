import Image from "next/image";

export default function TeamSlot({ crest, name }: { crest: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      {crest ? (
        <Image src={crest} alt={name} width={36} height={36} className="h-9 w-9 object-contain" />
      ) : (
        <div className="h-9 w-9" />
      )}
      <span className="w-full text-center text-[11px] leading-tight text-muted-foreground line-clamp-2">
        {name}
      </span>
    </div>
  );
}
