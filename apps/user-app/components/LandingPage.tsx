"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

/* ── Animated counter hook ─────────────────────────────────────────────── */
function useCounter(end: number, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) {
        setValue(end);
        clearInterval(id);
      } else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [end, duration]);
  return value;
}

/* ── Feature card data ─────────────────────────────────────────────────── */
const features = [
  {
    img: "/feature-p2p.png",
    title: "Instant P2P Transfers",
    desc: "Send money to anyone using just their phone number. Transfers settle in under a second.",
  },
  {
    img: "/feature-deposit.png",
    title: "Bank Deposits",
    desc: "Top up your wallet from HDFC, Axis and more. Confirmed automatically via secure webhooks.",
  },
  {
    img: "/feature-security.png",
    title: "Bank-Grade Security",
    desc: "HMAC-SHA256 verification, rate-limited auth, and encrypted sessions keep your money safe.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Account",
    desc: "Sign up with your phone number in seconds.",
  },
  {
    num: "02",
    title: "Add Money",
    desc: "Deposit from any supported bank instantly.",
  },
  {
    num: "03",
    title: "Send & Receive",
    desc: "Transfer to friends or pay anyone, fee-free.",
  },
];

/* ── Main component ────────────────────────────────────────────────────── */
export function LandingPage() {
  const users = useCounter(12000);
  const transactions = useCounter(850000);
  const uptime = useCounter(99);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#111633] to-[#0a0e1a] text-white overflow-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0a0e1a]/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <a
            href="/"
            className="flex items-center gap-1 font-extrabold text-2xl tracking-tight select-none hover:opacity-80 transition-opacity"
          >
            <span className="text-blue-400">Pay</span>
            <span className="text-purple-400">Flow</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#how" className="hover:text-white transition">
              How It Works
            </a>
            <a href="#stats" className="hover:text-white transition">
              Stats
            </a>
          </div>
          <button
            onClick={() => signIn()}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-6">
        {/* glow blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* text */}
          <div className="space-y-8 relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium tracking-wide uppercase">
              Digital Wallet &mdash; Reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              Your Money,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Lightning Fast
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Send, receive, and manage money with zero friction. PayFlow is the
              modern digital wallet built for speed, security, and simplicity.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => signIn()}
                className="group px-8 py-3.5 rounded-full font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-purple-900/30 hover:shadow-purple-700/50 hover:scale-105 active:scale-95"
              >
                Open Your Wallet
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>
              <a
                href="#features"
                className="px-8 py-3.5 rounded-full font-semibold border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
          {/* hero image */}
          <div className="relative flex justify-center md:justify-end z-10">
            <div className="relative w-[320px] sm:w-[380px] lg:w-[420px] animate-float">
              <Image
                src="/hero-dashboard.png"
                alt="PayFlow wallet dashboard"
                width={420}
                height={420}
                priority
                className="rounded-3xl drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Everything you need,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built from the ground up with modern technologies for the fastest,
            safest payment experience.
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur p-1 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="rounded-xl overflow-hidden">
                <Image
                  src={f.img}
                  alt={f.title}
                  width={600}
                  height={400}
                  className="w-full h-52 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how" className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
          {steps.map((s) => (
            <div key={s.num} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-2xl font-extrabold text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-300">
                {s.num}
              </div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section id="stats" className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { value: `${users.toLocaleString()}+`, label: "Active Users" },
            {
              value: `₹${(transactions / 100).toLocaleString()}L+`,
              label: "Transactions Processed",
            },
            { value: `${uptime}.9%`, label: "Uptime" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur p-10 hover:border-purple-500/20 transition-all"
            >
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {s.value}
              </div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute -inset-20 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 relative z-10">
            Ready to experience{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              the future of payments?
            </span>
          </h2>
          <p className="text-gray-400 mb-8 relative z-10">
            Join thousands already using PayFlow to move money instantly.
          </p>
          <button
            onClick={() => signIn()}
            className="relative z-10 px-10 py-4 rounded-full font-semibold text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-purple-900/40 hover:shadow-purple-700/60 hover:scale-105 active:scale-95"
          >
            Get Started Free &rarr;
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <a
            href="/"
            className="flex items-center gap-1 font-extrabold text-lg hover:opacity-80 transition-opacity"
          >
            <span className="text-blue-400">Pay</span>
            <span className="text-purple-400">Flow</span>
          </a>
          <p>&copy; {new Date().getFullYear()} PayFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
