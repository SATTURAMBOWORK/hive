import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Bell, CalendarDays, Wrench, Ticket,
  ArrowRight, ChevronLeft, ChevronRight, Zap,
  Star, BadgeCheck, ChevronDown,
  XCircle, CheckCircle2, Users, Rocket,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

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

const features = [
  {
    icon: Bell,
    title: "Announcements that get read",
    desc: "Instant, targeted notices reach every resident the moment you publish.",
    iconCls: "bg-amber-50 text-amber-500",
  },
  {
    icon: CalendarDays,
    title: "Events your whole community joins",
    desc: "A shared calendar so no resident ever misses a festival, AGM, or gathering.",
    iconCls: "bg-violet-50 text-violet-500",
  },
  {
    icon: Wrench,
    title: "Bookings without the back-and-forth",
    desc: "Reserve any amenity in under ten seconds — conflicts handled automatically.",
    iconCls: "bg-sky-50 text-sky-500",
  },
  {
    icon: Ticket,
    title: "Maintenance tracked to resolution",
    desc: "Every complaint logged, assigned, and closed with full visibility.",
    iconCls: "bg-emerald-50 text-emerald-500",
  },
];

const oldWay = [
  "Four WhatsApp groups, endless noise and confusion",
  "Paper maintenance receipts that vanish overnight",
  "Calling the guard every time you want to book the gym",
  "Nobody knows who's handling which complaint",
];

const newWay = [
  "One announcement reaches every resident instantly",
  "Full digital history of every maintenance request",
  "Any amenity booked in under ten seconds",
  "Every task tracked from open to fully resolved",
];

const steps = [
  {
    icon: Building2,
    num: "01",
    title: "Register your society",
    desc: "Sign up as Society Admin. Enter your society name and city — takes under five minutes.",
  },
  {
    icon: Users,
    num: "02",
    title: "Invite your residents",
    desc: "Share your unique society code. Residents self-register and request membership.",
  },
  {
    icon: Rocket,
    num: "03",
    title: "Go live instantly",
    desc: "Approve members, post the first announcement, and your community is live.",
  },
];

const row1Single = [
  { quote: "Finally, one place for everything. No more four separate WhatsApp groups.", name: "Ananya R.", role: "Secretary · Prestige Lakeside, Bangalore", initials: "AR", color: "bg-violet-500" },
  { quote: "Booking the gym used to mean calling the guard. Now it takes ten seconds.", name: "Rohan M.", role: "Resident · Green Heights, Pune", initials: "RM", color: "bg-sky-500" },
  { quote: "The committee saves at least two hours a week on announcements and approvals.", name: "Priya K.", role: "Committee Chair · Skyline Towers, Mumbai", initials: "PK", color: "bg-emerald-500" },
];

const row2Single = [
  { quote: "Maintenance tickets used to vanish into thin air. Now we track every single one.", name: "Vikram S.", role: "Resident · Brigade Orchards, Bangalore", initials: "VS", color: "bg-rose-500" },
  { quote: "Our residents actually read notices now. Real-time updates make all the difference.", name: "Deepa N.", role: "Secretary · Sobha City, Chennai", initials: "DN", color: "bg-amber-500" },
  { quote: "Setting up the society took fifteen minutes. The onboarding is incredibly smooth.", name: "Kiran T.", role: "Super Admin · Lodha Palava, Mumbai", initials: "KT", color: "bg-indigo-500" },
];

const row1 = [...row1Single, ...row1Single];
const row2 = [...row2Single, ...row2Single];

const maskStyle = {
  maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
  overflow: "hidden",
};


/* ══════════════════════════════════════════════════════════════
   CAROUSEL
══════════════════════════════════════════════════════════════ */
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
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{ backgroundImage: `url(${slide.image})`, opacity: fading ? 0 : 1 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />

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
      <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
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

      {/* Scroll cue */}
      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ animation: "bounce-cue 2s ease-in-out infinite" }}>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/50" />
      </div>

      <style>{`
        @keyframes bounce-cue {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROBLEM / SOLUTION
══════════════════════════════════════════════════════════════ */
function ProblemSolution() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-emerald-600">Why SocietyHub</p>
        <h2 className="mb-12 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Sound familiar?
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Old Way */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-7">
            <div className="mb-5 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-400" />
              <span className="text-sm font-extrabold uppercase tracking-wider text-rose-500">The Old Way</span>
            </div>
            <ul className="space-y-3.5">
              {oldWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* New Way */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-7">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-extrabold uppercase tracking-wider text-emerald-600">The SocietyHub Way</span>
            </div>
            <ul className="space-y-3.5">
              {newWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════════════ */
function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-emerald-600">Getting started</p>
        <h2 className="mb-14 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Live in three steps
        </h2>

        <div className="relative grid gap-10 md:grid-cols-3">
          {/* Connecting line (desktop only) */}
          <div className="absolute left-[16.66%] right-[16.66%] top-8 hidden h-px border-t-2 border-dashed border-emerald-200 md:block" />

          {steps.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
                  <Icon className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-extrabold text-white shadow">
                  {num.slice(1)}
                </span>
              </div>
              <p className="mb-2 text-base font-extrabold text-slate-900">{title}</p>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   TESTIMONIAL MARQUEE
══════════════════════════════════════════════════════════════ */
function TestimonialCard({ t }) {
  return (
    <div className="group w-80 shrink-0 rounded-2xl bg-white border border-slate-100 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="mb-3 flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <div className="mb-3 text-4xl font-black leading-none text-slate-200 select-none transition-colors duration-300 group-hover:text-emerald-400">"</div>
      <p className="text-sm leading-relaxed text-slate-600">{t.quote}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="relative shrink-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white ${t.color}`}>
            {t.initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-400">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section id="testimonials" className="overflow-hidden bg-slate-50 py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-12 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">What residents say</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Loved by communities across India
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
          From residents to committee chairs — everyone finds something that works for them.
        </p>
      </div>

      <div className="space-y-4">
        <div style={maskStyle}>
          <div className="flex gap-4"
            style={{ width: "max-content", animation: "marquee-left 40s linear infinite", animationPlayState: paused ? "paused" : "running" }}>
            {row1.map((t, i) => <TestimonialCard key={i} t={t} />)}
          </div>
        </div>
        <div style={maskStyle}>
          <div className="flex gap-4"
            style={{ width: "max-content", animation: "marquee-right 55s linear infinite", animationPlayState: paused ? "paused" : "running" }}>
            {row2.map((t, i) => <TestimonialCard key={i} t={t} />)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-left  { 0% { transform: translateX(0); }    100% { transform: translateX(-50%); } }
        @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white" style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
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

      <ProblemSolution />

      {/* Features */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-emerald-600">Features</p>
          <h2 className="mb-10 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Everything your society needs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, iconCls }) => (
              <div key={title} className="rounded-2xl border border-slate-100 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
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

      <HowItWorks />
      <TestimonialMarquee />
    </div>
  );
}
