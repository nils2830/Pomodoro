import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

const STEPS = [
  ["Write down what's next", "Add tasks, estimate the sessions, and say what kind of work it is. Insights groups your time by it."],
  ["Warm up", "When you sit down: name your first step, then rest your eyes on a dot for 30 seconds to 3 minutes."],
  ["Start, then forget the clock", "25 minutes by default. Hide the timer or switch to a face that doesn't count seconds."],
  ["Take the break", "5 minutes after each session, a longer one after every fourth. Breaks are part of the method."],
];

const FACES = [
  ["Hidden", "Nothing but a slow, breathing orb. Hold to peek if you must."],
  ["Wall clock", "The real time of day, with your session painted on the dial."],
  ["Ring", "Empties smoothly and tells you when it ends, not how many seconds are left."],
  ["Words", "“Settling in”, “about halfway”, “almost there”."],
];

/** Static explainer below the timer. Server-rendered for speed and search. */
export function FocusAbout() {
  return (
    <section className="neutral relative z-[1] rounded-t-[40px] bg-page text-ink">
      <div className="mx-auto max-w-[1180px] px-5 pt-20 pb-32 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="eyebrow text-ink-3">About Steen</div>
            <h2 className="display mt-4 text-[clamp(2.4rem,5vw,4rem)] leading-[0.92]">A timer that gets out of your way.</h2>
          </div>
          <div className="space-y-4 self-end text-[17px] leading-relaxed text-ink-2">
            <p>
              Steen is built on the Pomodoro Technique: short, single-minded work sessions separated by deliberate breaks. Francesco Cirillo developed it in
              the late 1980s with a tomato-shaped kitchen timer; the idea has outlived the tomato because it lowers the cost of starting and makes rest
              non-negotiable.
            </p>
            <p>
              Where Steen differs is what happens around the timer. A short warm-up, inspired by the steady-gaze practice trataka, gives every sit-down the same
              calm start. A ticking countdown can become its own distraction, so you can hide it or pick a face with no seconds at all. And every session is
              logged, so you can see how often you actually sit down, when, and for how long.
            </p>
          </div>
        </div>

        <div className="mt-20 grid border-t border-line md:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="border-b border-line py-8 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0">
              <div className="font-mono text-[13px] text-ink-3">0{i + 1}</div>
              <h3 className="display mt-6 text-[22px] leading-tight">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="eyebrow text-ink-3">Faces</div>
            <h3 className="display mt-4 text-[34px] leading-none">Time without the ticking.</h3>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {FACES.map(([name, body]) => (
                <li key={name} className="grid grid-cols-[130px_1fr] gap-4 py-4 text-[15px]">
                  <span className="font-semibold">{name}</span>
                  <span className="text-ink-2">{body}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between rounded-[32px] bg-ink p-8 text-page sm:p-10">
            <div>
              <div className="eyebrow opacity-60">Insights</div>
              <h3 className="display mt-4 text-[34px] leading-none">See your rhythm.</h3>
              <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed opacity-75">
                How many times a day you sit down, how long you stay, which hours work for you and which days slip. Steen groups back-to-back sessions into
                sit-downs so the numbers match how your day actually felt.
              </p>
            </div>
            <Link href="/insights" className="mt-10 inline-flex items-center gap-2 self-start rounded-full bg-page px-5 py-3 text-sm font-semibold text-ink">
              Open Insights <ArrowUpRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
