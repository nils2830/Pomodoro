import Link from "next/link";
import { T } from "@/core/shell/T";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="text-center">
        <div className="eyebrow text-ink-3">404</div>
        <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5rem)] leading-[0.9]">
          <T>Lost track of time?</T>
        </h1>
        <p className="mt-4 text-ink-2">
          <T>{"This page doesn't exist."}</T>
        </p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-btn px-6 text-sm font-semibold text-btn-ink">
          <T>Back to the timer</T>
        </Link>
      </div>
    </div>
  );
}
