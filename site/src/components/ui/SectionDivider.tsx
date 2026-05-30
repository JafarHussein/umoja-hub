/**
 * Full-bleed 1px horizontal rule that spans the canvas edge-to-edge.
 * Used between every top-level page section — never inside content columns.
 */
export function SectionDivider() {
  return (
    <div className="border-b border-rule" aria-hidden="true" />
  );
}
