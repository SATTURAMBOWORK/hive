import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Key,
  LayoutDashboard,
  LoaderCircle,
  Search,
  Ticket,
  UserCircle
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";

const TAB_KEYS = {
  overview: "overview",
  announcements: "announcements",
  tickets: "tickets",
  amenities: "amenities",
  events: "events"
};

const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
      active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

function displayDateTime(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function asDateValue(dateValue) {
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeId(entity) {
  if (!entity) return "";
  return entity._id || entity.id || "";
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState(TAB_KEYS.overview);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    try {
      const [announcementData, ticketData, eventData, bookingData] = await Promise.all([
        apiRequest("/announcements", { token }),
        apiRequest("/tickets", { token }),
        apiRequest("/events", { token }),
        apiRequest("/amenities/bookings", { token })
      ]);

      setAnnouncements(announcementData.items || []);
      setTickets(ticketData.items || []);
      setEvents(eventData.items || []);
      setBookings(bookingData.items || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const userId = normalizeId(user);

  const metrics = useMemo(() => {
    const now = Date.now();

    const openTickets = tickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed").length;
    const upcomingEvents = events.filter((event) => asDateValue(event.startAt) >= now).length;
    const myBookings = bookings.filter((booking) => normalizeId(booking.requestedBy) === userId).length;

    return {
      announcements: announcements.length,
      openTickets,
      upcomingEvents,
      myBookings
    };
  }, [announcements, bookings, events, tickets, userId]);

  const recentActivity = useMemo(() => {
    const activity = [
      ...announcements.slice(0, 4).map((item) => ({
        id: normalizeId(item),
        type: "announcement",
        title: item.title,
        description: item.body,
        when: item.createdAt
      })),
      ...tickets.slice(0, 4).map((item) => ({
        id: normalizeId(item),
        type: "ticket",
        title: item.title,
        description: `Status: ${item.status}`,
        when: item.createdAt
      })),
      ...events.slice(0, 4).map((item) => ({
        id: normalizeId(item),
        type: "event",
        title: item.title,
        description: `Starts at ${displayDateTime(item.startAt)}`,
        when: item.createdAt || item.startAt
      })),
      ...bookings.slice(0, 4).map((item) => ({
        id: normalizeId(item),
        type: "amenity",
        title: item.amenityName,
        description: `${item.date} ${item.startTime}-${item.endTime} (${item.status})`,
        when: item.createdAt
      }))
    ];

    return activity
      .sort((a, b) => asDateValue(b.when) - asDateValue(a.when))
      .slice(0, 8);
  }, [announcements, bookings, events, tickets]);

  const filteredAnnouncements = announcements.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return item.title?.toLowerCase().includes(q) || item.body?.toLowerCase().includes(q);
  });

  const filteredTickets = tickets.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
  });

  const filteredEvents = events.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return item.title?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q);
  });

  const filteredBookings = bookings.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return item.amenityName?.toLowerCase().includes(q) || item.status?.toLowerCase().includes(q);
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">G</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">GateKeeper</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === TAB_KEYS.overview} onClick={() => setActiveTab(TAB_KEYS.overview)} />
          <NavItem icon={Bell} label="Announcements" active={activeTab === TAB_KEYS.announcements} onClick={() => setActiveTab(TAB_KEYS.announcements)} />
          <NavItem icon={Ticket} label="Help Desk" active={activeTab === TAB_KEYS.tickets} onClick={() => setActiveTab(TAB_KEYS.tickets)} />
          <NavItem icon={Key} label="Amenities" active={activeTab === TAB_KEYS.amenities} onClick={() => setActiveTab(TAB_KEYS.amenities)} />
          <NavItem icon={Calendar} label="Events" active={activeTab === TAB_KEYS.events} onClick={() => setActiveTab(TAB_KEYS.events)} />
        </nav>

        <div className="bg-slate-50 rounded-2xl p-4 mt-auto">
          <div className="flex items-center gap-3">
            <UserCircle className="text-slate-400" size={40} />
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.fullName || "Resident"}</p>
              <p className="text-xs text-slate-500 font-medium">{user?.flatNumber ? `Flat ${user.flatNumber}` : "Flat not set"}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 text-sm focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Search announcements, tickets, events..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <div className="p-8 max-w-6xl mx-auto space-y-8">
          {error ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-rose-700 text-sm">{error}</div>
          ) : null}

          {isLoading && !announcements.length && !tickets.length && !events.length && !bookings.length ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 flex items-center gap-3 text-slate-600">
              <LoaderCircle className="animate-spin" size={18} />
              <span>Loading dashboard data...</span>
            </div>
          ) : null}

          <motion.section
            initial="hidden"
            animate="visible"
            variants={cardReveal}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden bg-indigo-900 rounded-[2rem] p-10 text-white shadow-2xl shadow-indigo-200"
          >
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-bold leading-tight">Welcome back, {user?.fullName || "Resident"}.</h2>
              <p className="mt-4 text-indigo-100 text-lg">
                {metrics.announcements} announcements, {metrics.openTickets} active tickets, {metrics.upcomingEvents} upcoming events, and {metrics.myBookings} of your amenity bookings are available right now.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -mr-20 -mt-20 blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-20 w-40 h-40 bg-indigo-300 rounded-full blur-3xl opacity-10"></div>
          </motion.section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Announcements" value={metrics.announcements} tone="indigo" />
            <MetricCard label="Open Tickets" value={metrics.openTickets} tone="amber" />
            <MetricCard label="Upcoming Events" value={metrics.upcomingEvents} tone="cyan" />
            <MetricCard label="My Bookings" value={metrics.myBookings} tone="emerald" />
          </div>

          {activeTab === TAB_KEYS.overview ? (
            <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
              </div>
              <div className="space-y-6">
                {recentActivity.length ? (
                  recentActivity.map((item) => (
                    <ActivityItem
                      key={`${item.type}-${item.id}`}
                      title={item.title}
                      desc={item.description}
                      time={displayDateTime(item.when)}
                      status={item.type}
                    />
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No activity found for your tenant yet.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === TAB_KEYS.announcements ? (
            <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Announcements</h3>
              {filteredAnnouncements.length ? (
                filteredAnnouncements.map((item) => (
                  <ListCard
                    key={normalizeId(item)}
                    title={item.title}
                    subtitle={`By ${item.createdBy?.fullName || "Community"}`}
                    meta={displayDateTime(item.createdAt)}
                    body={item.body}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No announcements found.</p>
              )}
            </section>
          ) : null}

          {activeTab === TAB_KEYS.tickets ? (
            <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Tickets</h3>
              {filteredTickets.length ? (
                filteredTickets.map((item) => (
                  <ListCard
                    key={normalizeId(item)}
                    title={item.title}
                    subtitle={`Category: ${item.category || "general"}`}
                    meta={`Status: ${item.status}`}
                    body={item.description}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No tickets found.</p>
              )}
            </section>
          ) : null}

          {activeTab === TAB_KEYS.events ? (
            <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Events</h3>
              {filteredEvents.length ? (
                filteredEvents.map((item) => (
                  <ListCard
                    key={normalizeId(item)}
                    title={item.title}
                    subtitle={item.location || "Community Area"}
                    meta={`${displayDateTime(item.startAt)} to ${displayDateTime(item.endAt)}`}
                    body={item.description || "No event description."}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No events found.</p>
              )}
            </section>
          ) : null}

          {activeTab === TAB_KEYS.amenities ? (
            <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Amenity Bookings</h3>
              {filteredBookings.length ? (
                filteredBookings.map((item) => (
                  <ListCard
                    key={normalizeId(item)}
                    title={item.amenityName}
                    subtitle={`${item.date} • ${item.startTime}-${item.endTime}`}
                    meta={`Status: ${item.status}`}
                    body={`Requested by ${item.requestedBy?.fullName || "resident"}`}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No amenity bookings found.</p>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function ActivityItem({ title, time, desc, status }) {
  const statusColor = {
    announcement: "bg-indigo-500",
    ticket: "bg-amber-500",
    event: "bg-cyan-500",
    amenity: "bg-emerald-500"
  };

  return (
    <div className="flex gap-4 group">
      <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${statusColor[status] || "bg-slate-400"}`}></div>
      <div className="flex-1 pb-6 border-b border-slate-100 group-last:border-0">
        <div className="flex justify-between items-start gap-4">
          <h4 className="font-bold text-slate-900">{title}</h4>
          <span className="text-xs font-medium text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const toneClass = {
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800"
  };

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={cardReveal}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border p-5 ${toneClass[tone] || "border-slate-200 bg-white text-slate-800"}`}
    >
      <p className="text-xs uppercase tracking-wide font-semibold opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </motion.article>
  );
}

function ListCard({ title, subtitle, meta, body }) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <p className="text-sm text-slate-700 mt-3 leading-relaxed">{body}</p>
    </article>
  );
}
