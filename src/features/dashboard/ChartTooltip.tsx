/**
 * Dark floating tooltip of the charts (2.2.1 pattern 4): inverse surface, white text,
 * the only floating element of a card, so it carries the level-1 elevation (2.5).
 */
export function ChartTooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md bg-inverse-surface px-3 py-2 text-body-small text-inverse-on-surface shadow-elevation-1">
      <p className="text-label-medium">{title}</p>
      {lines.map((line) => (
        <p key={line} className="tabular-nums">
          {line}
        </p>
      ))}
    </div>
  );
}
