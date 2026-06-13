import { cn } from "@/lib/utils"

/** Geometric Quanta "Q": a perfect circular ring plus a rectangular handle. */
export function QMark({ className }: { className?: string }) {
  return (
    <div className={cn("qmark", className)} aria-hidden role="presentation">
      <div className="qmark-halo" />
      <div className="qmark-center-glow" />
      <div className="qmark-handle">
        <div className="qmark-base" />
        <div className="qmark-sheen" />
        <div className="qmark-ellipse">
          <div className="qmark-orbit">
            <div className="qmark-blob" />
          </div>
        </div>
      </div>
      <div className="qmark-ring">
        <div className="qmark-base" />
        <div className="qmark-sheen" />
        <div className="qmark-ellipse">
          <div className="qmark-orbit">
            <div className="qmark-blob" />
          </div>
        </div>
      </div>
    </div>
  )
}
