interface AdSlotProps {
  label?: string;
  className?: string;
  format?: "horizontal" | "square" | "vertical";
}

const FORMAT_HEIGHT: Record<NonNullable<AdSlotProps["format"]>, string> = {
  horizontal: "min-h-[100px]",
  square: "min-h-[250px]",
  vertical: "min-h-[600px]",
};

// Reserved, layout-stable ad container. Swap the inner comment for the
// AdSense <ins> tag + script once approved — the reserved space prevents CLS.
export function AdSlot({ label = "Advertisement", className, format = "horizontal" }: AdSlotProps) {
  return (
    <div
      className={`ad-slot ${FORMAT_HEIGHT[format]} ${className ?? ""}`}
      role="complementary"
      aria-label={label}
      data-ad-slot={format}
    >
      {label}
    </div>
  );
}
