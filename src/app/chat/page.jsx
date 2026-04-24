"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Telescope, Compass, Radio } from "lucide-react";

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

/* ─────────────────────────────────────────────
   Shared atmosphere
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

function NoiseBg() {
    return (
        <>
            <style>{`
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          10% { transform: translate(-2%,-3%); }
          20% { transform: translate(3%,1%); }
          30% { transform: translate(-1%,4%); }
          40% { transform: translate(4%,-2%); }
          50% { transform: translate(-3%,3%); }
          60% { transform: translate(2%,-4%); }
          70% { transform: translate(-4%,2%); }
          80% { transform: translate(1%,-1%); }
          90% { transform: translate(-2%,4%); }
        }
        .grain-layer { animation: grain 0.4s steps(1) infinite; }
      `}</style>
            <div
                aria-hidden
                className="grain-layer pointer-events-none fixed inset-[-25%] z-0 opacity-[0.03]"
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
   404-specific: floating star particles
───────────────────────────────────────────── */
function StarField() {
    const [stars, setStars] = useState([]);

    useEffect(() => {
        setStars(
            Array.from({ length: 48 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 1.5 + 0.5,
                delay: Math.random() * 4,
                duration: Math.random() * 3 + 2,
            }))
        );
    }, []);

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
            {stars.map((s) => (
                <motion.span
                    key={s.id}
                    className="absolute rounded-full bg-foreground"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: s.size,
                        height: s.size,
                    }}
                    animate={{ opacity: [0.1, 0.7, 0.1] }}
                    transition={{
                        duration: s.duration,
                        delay: s.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   404-specific: glitch on "404"
───────────────────────────────────────────── */
function GlitchText({ children, className = "" }) {
    return (
        <span
            className={`relative inline-block select-none ${className}`}
            data-text={children}
        >
      {children}
            <style>{`
        [data-text="404"]::before,
        [data-text="404"]::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        [data-text="404"]::before {
          color: oklch(0.72 0.18 260);
          animation: g404-a 3.2s infinite steps(1);
          clip-path: polygon(0 10%, 100% 10%, 100% 44%, 0 44%);
          transform: translate(-3px, -1px);
        }
        [data-text="404"]::after {
          color: oklch(0.75 0.14 140);
          animation: g404-b 3.2s infinite steps(1);
          clip-path: polygon(0 60%, 100% 60%, 100% 90%, 0 90%);
          transform: translate(3px, 1px);
        }
        @keyframes g404-a {
          0%,78%,100% { opacity:0; transform:translate(0); }
          80% { opacity:1; transform:translate(-4px,-1px); }
          82% { opacity:1; transform:translate(3px,0); }
          84% { opacity:1; transform:translate(-2px,1px); }
          86% { opacity:0; }
        }
        @keyframes g404-b {
          0%,78%,100% { opacity:0; transform:translate(0); }
          81% { opacity:1; transform:translate(4px,1px); }
          83% { opacity:1; transform:translate(-3px,0); }
          85% { opacity:1; transform:translate(2px,-1px); }
          87% { opacity:0; }
        }
      `}</style>
    </span>
    );
}

/* ─────────────────────────────────────────────
   Orbit animation around icon
───────────────────────────────────────────── */
function OrbitRing({ radius = 52, duration = 6, reverse = false, dotColor = "var(--primary)" }) {
    return (
        <motion.div
            className="absolute"
            style={{ width: radius * 2, height: radius * 2 }}
            animate={{ rotate: reverse ? -360 : 360 }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
      <span
          className="absolute h-2 w-2 rounded-full"
          style={{
              background: dotColor,
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: `0 0 6px ${dotColor}`,
          }}
      />
            <span
                className="absolute inset-0 rounded-full border border-dashed opacity-20"
                style={{ borderColor: dotColor }}
            />
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Live timestamp
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
    return <span className="font-mono text-xs tabular-nums text-muted-foreground">{ts}</span>;
}

/* ─────────────────────────────────────────────
   Main 404 Page
───────────────────────────────────────────── */
export default function NotFoundPage() {
    const router = useRouter();
    const pathname = usePathname();

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });
    const bgX = useTransform(smoothX, [-1, 1], ["-10px", "10px"]);
    const bgY = useTransform(smoothY, [-1, 1], ["-10px", "10px"]);

    const handleMouseMove = (e) => {
        mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
        mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-background text-foreground"
            onMouseMove={handleMouseMove}
        >
            <NoiseBg />
            <Scanlines />
            <StarField />

            {/* Vignette */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-[1]"
                style={{
                    background:
                        "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 15%, hsl(var(--background)/0.75) 100%)",
                }}
            />

            {/* Blue/indigo ambient glow */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, oklch(0.55 0.18 260 / 0.10) 0%, transparent 70%)",
                    x: bgX,
                    y: bgY,
                }}
            />

            <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="flex w-full max-w-xl flex-col items-center gap-6 text-center"
                >
                    {/* Icon with orbit rings */}
                    <motion.div
                        variants={fadeUp}
                        custom={0.05}
                        className="relative flex h-44 w-44 items-center justify-center"
                    >
                        <OrbitRing radius={64} duration={7} dotColor="oklch(0.6 0.18 260)" />
                        <OrbitRing radius={46} duration={4.5} reverse dotColor="oklch(0.65 0.14 180)" />

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: 15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_40px_oklch(0.55_0.18_260/0.2)]"
                        >
                            <Telescope className="size-9 text-primary" strokeWidth={1.5} />
                        </motion.div>
                    </motion.div>

                    {/* 404 */}
                    <motion.div variants={fadeUp} custom={0.1} className="leading-none">
                        <GlitchText className="text-[clamp(5rem,18vw,9rem)] font-black tracking-tighter text-foreground/90">
                            404
                        </GlitchText>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        variants={fadeUp}
                        custom={0.15}
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Page Not Found
                    </motion.h1>

                    {/* Separator */}
                    <motion.div
                        variants={fadeUp}
                        custom={0.2}
                        className="flex w-full items-center gap-3"
                    >
                        <Separator className="flex-1 bg-border/60" />
                        <Compass className="size-4 shrink-0 text-muted-foreground/50" />
                        <Separator className="flex-1 bg-border/60" />
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        variants={fadeUp}
                        custom={0.25}
                        className="max-w-sm text-sm leading-relaxed text-muted-foreground"
                    >
                        The page you're looking for has drifted into the void. It may have
                        been moved, renamed, or never existed in this universe.
                    </motion.p>

                    {/* Log block */}
                    <motion.div
                        variants={fadeUp}
                        custom={0.3}
                        className="w-full rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-left font-mono text-xs text-muted-foreground backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-primary/80">ERR_NOT_FOUND</span>
                            <Timestamp />
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-[11px]">
                            <div>
                                <span className="text-muted-foreground/50">PATH&nbsp;&nbsp;&nbsp; </span>
                                <span className="text-foreground/70">{pathname}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground/50">STATUS  </span>
                                <span className="text-primary">404 Not Found</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground/50">REASON  </span>
                                <span className="text-foreground/70">Resource does not exist</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        variants={fadeUp}
                        custom={0.35}
                        className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
                    >
                        <Button variant="outline" className="gap-2" onClick={() => router.back()}>
                            <ArrowLeft className="size-4" />
                            Go Back
                        </Button>
                        <Button onClick={() => router.push("/")}>Return Home</Button>
                    </motion.div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute bottom-8 font-mono text-[10px] tracking-widest text-muted-foreground/30 uppercase"
                >
                    ResearchHub · Deep Space · Page Not Located
                </motion.p>
            </main>
        </div>
    );
}