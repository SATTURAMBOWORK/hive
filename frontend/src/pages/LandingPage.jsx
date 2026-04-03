import { Link } from "react-router-dom";
import {
  Building2,
  Bell,
  CalendarDays,
  Wrench,
  Ticket,
  ArrowRight,
  CheckCircle2,
  Users,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Bell,
    title: "Instant Announcements",
    desc: "Never miss a notice from your society committee. Important updates delivered straight to your dashboard.",
    color: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: CalendarDays,
    title: "Community Events",
    desc: "Discover, RSVP and participate in events happening right in your community.",
    color: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: Wrench,
    title: "Amenity Booking",
    desc: "Reserve the gym, clubhouse, or pool in seconds — no calls, no queues, no hassle.",
    color: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    icon: Ticket,
    title: "Maintenance Tickets",
    desc: "Raise and track complaints from start to resolution with full transparency.",
    color: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

const highlights = [
  "No app download needed — works in any browser",
  "Role-based access for residents, committee & admins",
  "Multi-society support with individual portals",
  "Secure, private data per community",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[Nunito] overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow shadow-emerald-300">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">SocietyHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-white px-6 pt-20 pb-28 text-center">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-emerald-100 opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 right-0 -z-10 h-72 w-72 rounded-full bg-amber-100 opacity-50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 left-0 -z-10 h-56 w-56 rounded-full bg-violet-100 opacity-40 blur-3xl"
        />

        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200 mb-6">
            <Zap className="h-3.5 w-3.5" /> Modern Society Management
          </span>

          <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Your apartment.{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-emerald-600">Simplified.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded bg-emerald-100"
              />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            One platform for announcements, events, amenity booking and maintenance
            tickets — built for residents who value their time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-emerald-300 hover:-translate-y-0.5"
            >
              Create your community
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
            >
              I already have an account
            </Link>
          </div>
        </div>

        {/* Mock UI preview card */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100">
            <div className="rounded-xl bg-white p-6 text-left shadow-inner">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Green Heights Society</p>
                  <p className="text-xs text-slate-400">Dashboard</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Rahul Sharma
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Announcements", val: "3 new", color: "bg-amber-50 text-amber-700" },
                  { label: "Upcoming Events", val: "2 this week", color: "bg-violet-50 text-violet-700" },
                  { label: "Amenity Slots", val: "Pool open", color: "bg-sky-50 text-sky-700" },
                  { label: "My Tickets", val: "1 pending", color: "bg-rose-50 text-rose-700" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
                    <p className="text-xs font-semibold opacity-70">{item.label}</p>
                    <p className="mt-1 text-sm font-extrabold">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              Everything your community needs
            </h2>
            <p className="mt-3 text-base text-slate-500">
              Four powerful features, one clean dashboard.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SocietyHub ── */}
      <section className="px-6 py-24 bg-white">
        <div className="mx-auto max-w-6xl grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-700 ring-1 ring-violet-100 mb-5">
              Why us
            </span>
            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
              Built for real apartment living
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              We know managing a housing society is messy — WhatsApp groups, printed
              notices, verbal complaints. SocietyHub replaces all of that with a clean,
              accessible portal every resident actually uses.
            </p>
            <ul className="mt-8 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-extrabold text-white shadow transition hover:bg-slate-700 hover:-translate-y-0.5"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stats / social proof */}
          <div className="grid grid-cols-2 gap-5">
            {[
              { icon: Users, stat: "500+", label: "Residents onboarded", bg: "bg-emerald-600" },
              { icon: Building2, stat: "30+", label: "Societies managed", bg: "bg-violet-600" },
              { icon: Ticket, stat: "1 200+", label: "Tickets resolved", bg: "bg-amber-500" },
              { icon: Shield, stat: "100%", label: "Private & secure", bg: "bg-sky-600" },
            ].map(({ icon: Icon, stat, label, bg }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center shadow-sm"
              >
                <div
                  className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${bg} text-white shadow`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-slate-900">{stat}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative isolate overflow-hidden bg-emerald-600 px-6 py-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -z-10 -translate-x-1/2 h-72 w-[700px] rounded-full bg-emerald-400 opacity-30 blur-3xl"
        />
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Ready to upgrade your society?
        </h2>
        <p className="mt-4 text-base text-emerald-100">
          Join hundreds of communities already using SocietyHub.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-emerald-700 shadow-lg transition hover:bg-emerald-50 hover:-translate-y-0.5"
          >
            Create your community — it's free
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-emerald-400 px-8 py-4 text-base font-bold text-white transition hover:bg-emerald-700 hover:-translate-y-0.5"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-8 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-slate-600">SocietyHub</span>
        </div>
        <p>© {new Date().getFullYear()} SocietyHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
