import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="text-center">
        <div className="eyebrow text-ink-3">404</div>
        <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5rem)] leading-[0.9]">Lost track of time?</h1>
        <p className="mt-4 text-ink-2">This page doesn&apos;t exist.</p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-btn px-6 text-sm font-semibold text-btn-ink">
          Back to the timer
        </Link>
      </div>
    </div>
  );
}
