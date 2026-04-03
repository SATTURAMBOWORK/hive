import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Bell,
  CalendarDays,
  Wrench,
  Ticket,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
} from "lucide-react";

/* ── Carousel data ───────────────────────────────────────── */
const slides = [
  {
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80",
    tag: "Modern Society Management",
    headline: "Your community,\nbeautifully managed.",
    sub: "One platform for every resident, committee member and staff — no app download required.",
  },
  {
    image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1920&q=80",
    tag: "Amenity Booking",
    headline: "Book the pool.\nNo calls needed.",
    sub: "Reserve the gym, clubhouse or pool in seconds — conflict-free and instant.",
  },
  {
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80",
    tag: "Community Events",
    headline: "Never miss what's\nhappening around you.",
    sub: "Society events, festivals, AGMs — all in one organised calendar.",
  },
  {
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1920&q=80",
    tag: "Maintenance Tickets",
    headline: "Raise a complaint.\nTrack it to resolution.",
    sub: "Full transparency from open to closed — no more chasing anyone.",
  },
];

/* ── Feature cards ───────────────────────────────────────── */
const features = [
  { icon: Bell,        title: "Announcements",    desc: "Instant notices to every resident.", iconCls: "bg-amber-50 text-amber-500" },
  { icon: CalendarDays,title: "Events",           desc: "Shared calendar for the community.",  iconCls: "bg-violet-50 text-violet-500" },
  { icon: Wrench,      title: "Amenity Booking",  desc: "Reserve facilities in seconds.",       iconCls: "bg-sky-50 text-sky-500" },
  { icon: Ticket,      title: "Maintenance",      desc: "Track complaints start to finish.",    iconCls: "bg-emerald-50 text-emerald-500" },
];

/* ── Testimonials (duplicated for seamless marquee loop) ─── */
const testimonialsSingle = [
  { quote: "Finally, one place for everything. No more four separate WhatsApp groups.",         name: "Ananya R.",   role: "Secretary · Prestige Lakeside, Bangalore" },
  { quote: "Booking the gym used to mean calling the guard. Now it takes ten seconds.",          name: "Rohan M.",   role: "Resident · Green Heights, Pune" },
  { quote: "The committee saves at least two hours a week on announcements and approvals.",       name: "Priya K.",   role: "Committee Chair · Skyline Towers, Mumbai" },
  { quote: "Maintenance tickets used to vanish into thin air. Now we track every single one.",   name: "Vikram S.",  role: "Resident · Brigade Orchards, Bangalore" },
  { quote: "Our residents actually read notices now. The real-time updates make all the difference.", name: "Deepa N.", role: "Secretary · Sobha City, Chennai" },
  { quote: "Setting up the society took fifteen minutes. The onboarding is incredibly smooth.",  name: "Kiran T.",   role: "Super Admin · Lodha Palava, Mumbai" },
];
// Duplicate so the marquee scrolls seamlessly
const testimonials = [...testimonialsSingle, ...testimonialsSingle];

/* ═══════════════════════════════════════════════════════════
   Carousel
═══════════════════════════════════════════════════════════ */
function Carousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((index) => {
    if (index === active) return;
    setFading(true);
    setTimeout(() => { setActive(index); setFading(false); }, 350);
  }, [active]);

  const prev = () => goTo((active - 1 + slides.length) % slides.length);
  const next = useCallback(() => goTo((active + 1) % slides.length), [active, goTo]);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const slide = slides[active];

  return (
    <div className="relative h-[88vh] min-h-[520px] w-full overflow-hidden bg-slate-900">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{ backgroundImage: `url(${slide.image})`, opacity: fading ? 0 : 1 }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />

      {/* Minimal top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white drop-shadow">SocietyHub</span>
        </div>
        <Link
          to="/login"
          className="rounded-xl border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          Sign in
        </Link>
      </div>

      {/* Slide content */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-500"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          <Zap className="h-3 w-3 text-emerald-300" />
          {slide.tag}
        </span>
        <h1
          className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
          style={{ whiteSpace: "pre-line" }}
        >
          {slide.headline}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
          {slide.sub}
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl transition hover:bg-emerald-500 hover:-translate-y-0.5"
          >
            Get started — it's free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:-translate-y-0.5"
          >
            I already have an account
          </Link>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={prev} aria-label="Previous slide"
        className="absolute left-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} aria-label="Next slide"
        className="absolute right-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
            className="transition-all duration-300"
            style={{
              height: "8px", borderRadius: "9999px",
              width: i === active ? "28px" : "8px",
              background: i === active ? "#10b981" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Testimonial marquee (auto-scroll, no arrows)
═══════════════════════════════════════════════════════════ */
function TestimonialMarquee() {
  return (
    <section className="overflow-hidden bg-slate-50 py-16">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">What residents say</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Loved by communities across India
        </h2>
      </div>

      {/* Fade edges */}
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-slate-50 to-transparent" />

        {/* Scrolling track */}
        <div
          className="flex gap-5"
          style={{
            width: "max-content",
            animation: "marquee 40s linear infinite",
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-slate-600 italic">"{t.quote}"</p>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Landing page
═══════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white" style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      {/* Carousel */}
      <Carousel />

      {/* Stats strip */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-6 sm:grid-cols-4">
          {[
            { value: "500+",   label: "Residents" },
            { value: "30+",    label: "Societies" },
            { value: "1,200+", label: "Tickets resolved" },
            { value: "100%",   label: "Browser-based" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-slate-900">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — compact 4-column grid */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-emerald-600">Features</p>
          <h2 className="mb-10 text-center text-3xl font-black tracking-tight text-slate-900">
            Everything your society needs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, iconCls }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconCls}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-extrabold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial marquee */}
      <TestimonialMarquee />

      {/* Footer with inline CTA */}
      <footer className="border-t border-slate-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-base font-extrabold text-slate-800">SocietyHub</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} SocietyHub. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
