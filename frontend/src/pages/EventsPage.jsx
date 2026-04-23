import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../components/api';
import { useAuth } from '../components/AuthContext';
import { 
  Calendar, MapPin, Check, Plus, X, ChevronDown, 
  ArrowRight, Users, Ticket, CheckCircle2, CalendarPlus
} from 'lucide-react';

/* --- STYLES --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .page-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #FAFAFC 0%, #EEF2FF 100%);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1C1C1E;
    padding: 48px 32px 120px;
    box-sizing: border-box;
  }
  
  .content-wrapper {
    max-width: 1280px;
    margin: 0 auto;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
  }

  .title-editorial {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-weight: 700;
  }

  /* Smart Filter */
  .smart-filter {
    font-size: 2.2rem;
    font-weight: 600;
    color: #8E8E93;
    margin-bottom: 48px;
    letter-spacing: -0.02em;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .smart-filter-text {
    color: #1C1C1E;
  }

  .dropdown-wrapper {
    position: relative;
    display: inline-block;
  }

  .dropdown-trigger {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #1C1C1E;
    background: transparent;
    border: none;
    border-bottom: 3px solid #1C1C1E;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px 4px;
    transition: color 0.2s ease;
  }

  .dropdown-trigger:hover {
    color: #4F46E5;
    border-color: #4F46E5;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    padding: 8px;
    min-width: 240px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
    z-index: 50;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .dropdown-item {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1C1C1E;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .dropdown-item:hover {
    background: rgba(0,0,0,0.03);
  }

  /* Hero Layout */
  .hero-card {
    background: #FFFFFF;
    border-radius: 24px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    margin-bottom: 32px;
    min-height: 400px;
    position: relative;
  }

  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-content {
    padding: 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .hero-tag {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
    width: fit-content;
  }

  .hero-title {
    font-size: 3rem;
    line-height: 1.1;
    color: #1C1C1E;
    margin-bottom: 16px;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #8E8E93;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 32px;
  }

  /* Bento Box Layout */
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    auto-flow: dense;
  }

  /* Ticket Card (Digital Passbook) */
  .ticket-wrapper {
    perspective: 1500px;
    height: 100%;
    min-height: 380px;
  }

  .ticket-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .ticket-inner.flipped {
    transform: rotateY(180deg);
  }

  .ticket-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
  }

  .ticket-back {
    transform: rotateY(180deg);
    background: #FAFAFC;
    border: 1px solid rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
  }

  .ticket-top {
    padding: 24px 24px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ticket-divider {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .ticket-cutout-left, .ticket-cutout-right {
    position: absolute;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #FAFAFC 0%, #EEF2FF 100%);
    border-radius: 50%;
    top: 0;
    box-shadow: inset 0 3px 6px rgba(0,0,0,0.02);
  }

  .ticket-cutout-left { left: -12px; }
  .ticket-cutout-right { right: -12px; }

  .ticket-dash {
    width: 100%;
    margin: 0 24px;
    border-top: 2px dashed rgba(0,0,0,0.1);
  }

  .ticket-bottom {
    padding: 20px 24px 24px;
    background: #FFFFFF;
    border-radius: 0 0 20px 20px;
  }

  .rsvp-button {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    transition: all 0.2s ease;
  }

  /* FAB & Drawer */
  .fab {
    position: fixed;
    bottom: 40px;
    right: 40px;
    width: 64px;
    height: 64px;
    border-radius: 32px;
    background: #1C1C1E;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    cursor: pointer;
    border: none;
    z-index: 100;
  }

  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.2);
    backdrop-filter: blur(8px);
    z-index: 150;
  }

  .drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 500px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    box-shadow: -20px 0 60px rgba(0,0,0,0.1);
    z-index: 160;
    padding: 40px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  /* Social Proof */
  .avatar-group {
    display: flex;
    align-items: center;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #FFFFFF;
    background: #E5E5EA;
    margin-left: -12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }
  .avatar:first-child { margin-left: 0; }

  /* Form Elements */
  .input-field {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.5);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1rem;
    margin-bottom: 20px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .input-field:focus { border-color: #4F46E5; }
`;

/* --- MOCK DATA & CONSTANTS --- */
const SPRING_TRANSITION = { type: "spring", stiffness: 300, damping: 24 };

const CATEGORIES = [
  { id: 'All Events', label: 'All Events', color: '#1C1C1E', bg: '#F2F2F7' },
  { id: 'General', label: 'General', color: '#E8890C', bg: '#FFF4E5' },
  { id: 'Cultural', label: 'Cultural', color: '#6D28D9', bg: '#F3E8FF' },
  { id: 'Workshop', label: 'Workshop', color: '#16A34A', bg: '#E6F4EA' }
];

const TIME_FILTERS = ['Anytime', 'Today', 'This Week', 'This Month'];

/* --- COMPONENTS --- */

const Dropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {value} <ChevronDown size={24} strokeWidth={3} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={SPRING_TRANSITION}
          >
            {options.map(opt => (
              <button 
                key={opt.id || opt} 
                className="dropdown-item"
                onClick={() => { onChange(opt.id || opt); setIsOpen(false); }}
              >
                {opt.label || opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SocialProof = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div className="avatar-group">
      <div className="avatar" style={{ background: '#E8890C', zIndex: 3 }}>A</div>
      <div className="avatar" style={{ background: '#6D28D9', zIndex: 2 }}>P</div>
      <div className="avatar" style={{ background: '#16A34A', zIndex: 1 }}>R</div>
    </div>
    <span style={{ fontSize: '0.85rem', color: '#8E8E93', fontWeight: 600 }}>
      Amit, Priya, and 12 others are going.
    </span>
  </div>
);

const QRCodeMock = () => (
  <div style={{ width: '120px', height: '120px', background: '#FFFFFF', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: '4px', alignContent: 'flex-start' }}>
    {Array.from({ length: 25 }).map((_, i) => (
      <div key={i} style={{ width: '20px', height: '20px', background: Math.random() > 0.3 ? '#1C1C1E' : 'transparent', borderRadius: '4px' }} />
    ))}
  </div>
);

const TicketCard = ({ event, span }) => {
  const [flipped, setFlipped] = useState(false);
  const cat = CATEGORIES.find(c => c.id === (event.category || 'General')) || CATEGORIES[1];

  return (
    <motion.div 
      className="ticket-wrapper" 
      style={{ gridColumn: `span ${span}` }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_TRANSITION}
    >
      <div className={`ticket-inner ${flipped ? 'flipped' : ''}`}>
        
        {/* Front Face */}
        <div className="ticket-face">
          <div className="ticket-top">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ background: cat.bg, color: cat.color, padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {cat.label}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: '#8E8E93', fontWeight: 600, fontSize: '0.85rem' }}>
                <span style={{ color: '#1C1C1E', fontWeight: 700 }}>{new Date(event.startAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(event.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <h3 className="title-editorial" style={{ fontSize: '1.8rem', lineHeight: 1.2, color: '#1C1C1E', flex: 1 }}>
              {event.title}
            </h3>
            
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8E8E93', fontSize: '0.9rem', fontWeight: 600, marginTop: '16px' }}>
                <MapPin size={16} /> {event.location}
              </div>
            )}
          </div>

          <div className="ticket-divider">
            <div className="ticket-cutout-left" />
            <div className="ticket-dash" />
            <div className="ticket-cutout-right" />
          </div>

          <div className="ticket-bottom">
            <div style={{ marginBottom: '16px' }}>
              <SocialProof />
            </div>
            <motion.button 
              className="rsvp-button"
              style={{ background: '#1C1C1E', color: '#FFFFFF' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFlipped(true)}
            >
              RSVP to Event
            </motion.button>
          </div>
        </div>

        {/* Back Face */}
        <div className="ticket-face ticket-back">
          <QRCodeMock />
          <h4 style={{ margin: '24px 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#1C1C1E' }}>Confirmed!</h4>
          <p style={{ color: '#8E8E93', fontWeight: 500, fontSize: '0.95rem', marginBottom: '32px' }}>
            You're on the guest list.
          </p>
          
          <motion.button 
            style={{ 
              background: 'transparent', border: '2px solid #1C1C1E', padding: '10px 20px', 
              borderRadius: '100px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CalendarPlus size={18} /> Add to Calendar
          </motion.button>
          
          <button 
            onClick={() => setFlipped(false)}
            style={{ background: 'none', border: 'none', color: '#8E8E93', fontWeight: 600, marginTop: '24px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Close Ticket
          </button>
        </div>

      </div>
    </motion.div>
  );
};

export function EventsPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [category, setCategory] = useState('All Events');
  const [time, setTime] = useState('Anytime');
  
  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    apiRequest('/events', { token })
      .then(data => { setEvents(data.items || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  const upcoming = useMemo(() => events.filter(e => new Date(e.startAt) >= new Date()).sort((a,b) => new Date(a.startAt) - new Date(b.startAt)), [events]);
  
  const filtered = useMemo(() => {
    return upcoming.filter(e => {
      const catMatch = category === 'All Events' || (e.category || 'General') === category;
      return catMatch; // Basic filtering for demo
    });
  }, [upcoming, category, time]);

  const heroEvent = filtered[0];
  const bentoEvents = filtered.slice(1);
  const spans = [4, 4, 4, 6, 6, 8, 4]; // Organic bento layout

  return (
    <>
      <style>{styles}</style>
      <div className="page-container">
        <div className="content-wrapper">
          
          <motion.div 
            className="smart-filter"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_TRANSITION, delay: 0.1 }}
          >
            <span className="smart-filter-text">Show me</span>
            <Dropdown value={category} options={CATEGORIES} onChange={setCategory} />
            <span className="smart-filter-text">happening</span>
            <Dropdown value={time} options={TIME_FILTERS} onChange={setTime} />
            <span className="smart-filter-text">.</span>
          </motion.div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', fontWeight: 600, color: '#8E8E93' }}>Loading events...</div>
          ) : !heroEvent ? (
            <div style={{ textAlign: 'center', padding: '100px', fontWeight: 600, color: '#8E8E93' }}>No events found for this filter.</div>
          ) : (
            <>
              {/* Hero Section */}
              <motion.div 
                className="hero-card"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...SPRING_TRANSITION, delay: 0.2 }}
              >
                <div className="hero-content">
                  <span className="hero-tag" style={{ background: '#F3E8FF', color: '#6D28D9' }}>
                    {heroEvent.category || 'Featured'}
                  </span>
                  <h2 className="title-editorial hero-title">{heroEvent.title}</h2>
                  <div className="hero-meta">
                    <span><Calendar size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> {new Date(heroEvent.startAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    {heroEvent.location && <span><MapPin size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> {heroEvent.location}</span>}
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <SocialProof />
                    <motion.button 
                      style={{ background: '#1C1C1E', color: '#FFFFFF', padding: '16px 32px', borderRadius: '100px', border: 'none', fontWeight: 700, fontSize: '1.1rem', marginTop: '24px', cursor: 'pointer' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        window.scrollTo({
                          top: document.querySelector('.bento-grid') ? document.querySelector('.bento-grid').offsetTop - 100 : 0,
                          behavior: 'smooth'
                        });
                      }}
                    >
                      Reserve your spot <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '8px' }} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ height: '100%', background: '#F2F2F7', overflow: 'hidden' }}>
                  <img 
                    src={heroEvent.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80"} 
                    alt="Event Cover" 
                    className="hero-image"
                  />
                </div>
              </motion.div>

              {/* Bento Grid */}
              <div className="bento-grid">
                <AnimatePresence>
                  {bentoEvents.map((ev, i) => (
                    <TicketCard key={ev._id} event={ev} span={spans[i % spans.length]} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

        </div>

        {/* FAB for Admins */}
        {['committee', 'super_admin'].includes(user?.role) && (
          <motion.button 
            className="fab"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
          >
            <Plus size={32} />
          </motion.button>
        )}

        {/* Side Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div 
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div 
                className="drawer-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={SPRING_TRANSITION}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <h2 className="title-editorial" style={{ fontSize: '2.5rem', color: '#1C1C1E' }}>Host Event</h2>
                  <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                    <X size={28} color="#1C1C1E" />
                  </button>
                </div>

                <form>
                  <input type="text" className="input-field" placeholder="Event Title (e.g. Diwali Rooftop Mixer)" />
                  <select className="input-field">
                    <option>Cultural</option>
                    <option>Workshop</option>
                    <option>General</option>
                  </select>
                  <input type="text" className="input-field" placeholder="Location" />
                  <input type="datetime-local" className="input-field" />
                  <textarea className="input-field" placeholder="Description" rows={4} />
                  
                  <motion.button 
                    type="button"
                    style={{ width: '100%', background: '#1C1C1E', color: '#FFFFFF', padding: '18px', borderRadius: '14px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', marginTop: '20px' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDrawerOpen(false)}
                  >
                    Publish Event
                  </motion.button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
