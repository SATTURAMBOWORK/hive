import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function FeatureCard({
  title,
  description,
  icon,
  color,
  AnimationPanel,
  layout = "text-left",
  highlighted = false,
  index = 0,
}) {
  const isTextLeft = layout === "text-left";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      viewport={{ once: true, margin: "-100px" }}
      className="feature-card-container"
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "40px",
        alignItems: "center",
      }}
    >
      {/* TEXT SECTION */}
      <div style={{ order: isTextLeft ? 0 : 1 }}>
        <motion.div
          initial={{ opacity: 0, x: isTextLeft ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: (index * 0.1) + 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "11px",
              background: `${color}15`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "20px", flexShrink: 0,
            }}>
              {icon}
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: color }}>{title}</h3>
          </div>
          <p style={{ fontSize: "15px", lineHeight: "1.65", color: "#64748B", marginBottom: "0px" }}>
            {description}
          </p>
        </motion.div>
      </div>

      {/* ANIMATION SECTION — fills the remaining column width */}
      <div style={{ order: isTextLeft ? 1 : 0 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: (index * 0.1) + 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            border: highlighted ? "2px solid #2563EB" : "1px solid #E2E8F0",
            boxShadow: highlighted
              ? "0 8px 32px rgba(37,99,235,.14), 0 24px 56px rgba(15,23,42,.08)"
              : "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)",
            padding: "20px 24px",
            width: "100%",
          }}
        >
          {/* Live badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "11px", color: "#16A34A", fontWeight: 600, marginBottom: "14px",
          }}>
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#22C55E", display: "inline-block",
              animation: "pulse 1.6s ease-in-out infinite",
            }}/>
            Live Demo
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <AnimationPanel />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.5); }
        }
        @media (max-width: 960px) {
          .feature-card-container {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .feature-card-container [style*="order: 0"],
          .feature-card-container [style*="order: 1"] {
            order: unset !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
