"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Fingerprint } from "lucide-react";

/* ─────────────────────────────────────────────
   Reusable animation variants
───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

/* ─────────────────────────────────────────────
   Glitch Text — CSS-keyframe driven
───────────────────────────────────────────── */
function GlitchText({ children, className = "" }) {
  return (
    <span
      className={`relative inline-block select-none ${className}`}
      data-text={children}
      style={{ "--glitch-content": `"${children}"` }}
    >
      {children}
      <style>{`
        [data-text]::before,
        [data-text]::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        [data-text]::before {
          color: oklch(0.65 0.22 25);
          animation: glitch-top 2.8s infinite steps(1);
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          transform: translate(-2px, -1px);
        }
        [data-text]::after {
          color: oklch(0.72 0.18 200);
          animation: glitch-bot 2.8s infinite steps(1);
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          transform: translate(2px, 1px);
        }
        @keyframes glitch-top {
          0%,80%,100% { opacity: 0; transform: translate(0); }
          82%          { opacity: 1; transform: translate(-3px, -1px); }
          84%          { opacity: 1; transform: translate(3px, 0px); }
          86%          { opacity: 1; transform: translate(-2px, 1px); }
          88%          { opacity: 0; }
        }
        @keyframes glitch-bot {
          0%,80%,100% { opacity: 0; transform: translate(0); }
          83%          { opacity: 1; transform: translate(3px, 1px); }
          85%          { opacity: 1; transform: translate(-3px, 0px); }
          87%          { opacity: 1; transform: translate(2px, -1px); }
          89%          { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

/* ─────────────────────────────────────────────
   Scanline overlay
───────────────────────────────────────────── */
function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Animated noise grain
───────────────────────────────────────────── */
function NoiseBg() {
  return (
    <>
      <style>{`
        @keyframes grain {
          0%,100% { transform: translate(0, 0); }
          10%      { transform: translate(-2%, -3%); }
          20%      { transform: translate(3%, 1%); }
          30%      { transform: translate(-1%, 4%); }
          40%      { transform: translate(4%, -2%); }
          50%      { transform: translate(-3%, 3%); }
          60%      { transform: translate(2%, -4%); }
          70%      { transform: translate(-4%, 2%); }
          80%      { transform: translate(1%, -1%); }
          90%      { transform: translate(-2%, 4%); }
        }
        .grain-layer {
          animation: grain 0.4s steps(1) infinite;
        }
      `}</style>
      <div
        aria-hidden
        className="grain-layer pointer-events-none fixed inset-[-25%] z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────
   Live timestamp ticker
───────────────────────────────────────────── */
function Timestamp() {
  const [ts, setTs] = useState("");
  useEffect(() => {
    const tick = () =>
      setTs(new Date().toISOString().replace("T", "  ").slice(0, 22) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {ts}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main 403 Page
───────────────────────────────────────────── */
export default function Forbidden() {
  const router = useRouter();

  /* subtle parallax on mouse move */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const bgX = useTransform(smoothX, [-1, 1], ["-8px", "8px"]);
  const bgY = useTransform(smoothY, [-1, 1], ["-8px", "8px"]);

  const handleMouseMove = (e) => {
    const { innerWidth: w, innerHeight: h } = window;
    mouseX.set((e.clientX / w - 0.5) * 2);
    mouseY.set((e.clientY / h - 0.5) * 2);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      onMouseMove={handleMouseMove}
    >
      {/* ── Atmospheric layers ── */}
      <NoiseBg />
      <Scanlines />

      {/* ── Radial vignette ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-1"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, hsl(var(--background)/0.7) 100%)",
        }}
      />

      {/* ── Subtle red ambient glow behind icon ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-1 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, each(0.55 0.22 25 / 0.12) 0%, transparent 70%)",
          x: bgX,
          y: bgY,
        }}
      />

      {/* ── Main content ── */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-xl flex-col items-center gap-6 text-center"
        >
          {/* 403 number */}
          <motion.div variants={fadeUp} custom={0.1} className="leading-none">
            <GlitchText className="text-[clamp(5rem,18vw,9rem)] font-black tracking-tighter text-foreground/90">
              403
            </GlitchText>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            custom={0.15}
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Access Forbidden
          </motion.h1>

          {/* Separator with icon */}
          <motion.div
            variants={fadeUp}
            custom={0.2}
            className="flex w-full items-center gap-3"
          >
            <Separator className="flex-1 bg-border/60" />
            <Fingerprint className="size-4 shrink-0 text-muted-foreground/50" />
            <Separator className="flex-1 bg-border/60" />
          </motion.div>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            custom={0.25}
            className="max-w-sm text-sm leading-relaxed text-muted-foreground"
          >
            You don't have the necessary permissions to view this resource. If
            you believe this is a mistake, contact your administrator.
          </motion.p>

          {/* Monospace log block */}
          <motion.div
            variants={fadeUp}
            custom={0.3}
            className="w-full rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-left font-mono text-xs text-muted-foreground backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-destructive/80">ERR_FORBIDDEN</span>
              <Timestamp />
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px]">
              <div>
                <span className="text-muted-foreground/50">
                  PATH&nbsp;&nbsp;&nbsp;{" "}
                </span>
                <span className="text-foreground/70">
                  {typeof window !== "undefined"
                    ? window.location.pathname
                    : "/restricted"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground/50">STATUS </span>
                <span className="text-destructive">403 Forbidden</span>
              </div>
              <div>
                <span className="text-muted-foreground/50">REASON </span>
                <span className="text-foreground/70">
                  Insufficient privileges
                </span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            variants={fadeUp}
            custom={0.35}
            className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
            <Button onClick={() => router.push("/")} className="gap-2">
              Return Home
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom meta line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 font-mono text-[10px] tracking-widest text-muted-foreground/30 uppercase"
        >
          ResearchHub · Secure Zone · Unauthorized Access Logged
        </motion.p>
      </main>
    </div>
  );
}
