"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { LogoMark } from "@/core/ui/Logo";
import { getBackground } from "@/core/theme/backgrounds";
import { AuthPanel } from "./AuthPanel";
import { EASE } from "./motion";

/** Full-screen sign-in: a landscape on one side, the form on the other. */
export function LoginScreen() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";
  const bg = getBackground(mode === "signup" ? "dawn" : "fjord")!;
  const error = params.get("error");

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.15fr_1fr]">
      <div className="absolute inset-0 overflow-hidden lg:relative" style={{ backgroundColor: bg.color }}>
        <div className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url(${bg.blur})` }} />
        <motion.img
          src={bg.src}
          alt=""
          className="absolute inset-0 size-full object-cover"
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1.02 }}
          transition={{ duration: 2.4, ease: EASE }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 lg:bg-gradient-to-r lg:from-black/10 lg:via-black/10 lg:to-black/60" />
        <div className="absolute inset-x-0 bottom-0 hidden p-10 lg:block">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
            className="display max-w-[16ch] text-[44px] leading-[0.95] text-white"
          >
            Sit down. Stay steady.
          </motion.p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-svh flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2 text-ink">
            <LogoMark size={22} animated />
            <span className="display text-[21px] tracking-[-0.05em]">steen</span>
          </Link>
          <Link href="/welcome" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-ink-2 hover:text-ink">
            <ArrowLeft size={14} weight="bold" /> Back
          </Link>
        </div>
        <div className="my-auto w-full max-w-[440px] self-center py-12">
          <motion.div initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, delay: 0.15, ease: EASE }}>
            <AuthPanel mode={mode} next={params.get("next")} initialError={error} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
