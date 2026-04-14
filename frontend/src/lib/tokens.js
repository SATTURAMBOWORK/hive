export const tok = {
  cream:         "#111111",
  stone50:       "#171717",
  stone100:      "#202020",
  stone200:      "#2D2D2D",
  stone400:      "#8A8A8A",
  stone600:      "#B3B3B3",
  stone800:      "#F3F3F3",
  gold:          "#F3F3F3",
  goldLight:     "#D7D7D7",
  goldBorder:    "#9A9A9A",
  indigo:        "#3D52A0",
  indigoLight:   "#EEF1FA",
  indigoBorder:  "#C7D0EE",
  emerald:       "#1A7A5E",
  emeraldLight:  "#E6F5F0",
  emeraldBorder: "#B2DECE",
  rose:          "#C0392B",
  roseLight:     "#FBF0EE",
  roseBorder:    "#F5C6C2",
  amber:         "#B5620D",
  amberLight:    "#FEF5E7",
  amberBorder:   "#FDE68A",
  violet:        "#6D28D9",
  violetLight:   "#EDE9FE",
  violetBorder:  "#C4B5FD",
};

export const fonts = {
  sans:    "'DM Sans', 'Inter', sans-serif",
  display: "'DM Serif Display', 'Nunito', serif",
};

/* Shared card style */
export const card = {
  background: tok.cream,
  border: `1px solid ${tok.stone200}`,
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,0.3), 0 16px 36px rgba(0,0,0,0.24)",
};

/* Shared field style */
export const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  fontFamily: fonts.sans,
  background: tok.stone50,
  border: `1px solid ${tok.stone200}`,
  borderRadius: 12,
  color: tok.stone800,
  outline: "none",
  transition: "border-color .15s",
};

/* Shared button styles */
export const btn = {
  primary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, fontFamily: fonts.sans,
    background: tok.emerald, color: "#fff", border: "none",
    borderRadius: 12, cursor: "pointer",
    boxShadow: "0 10px 24px rgba(26,122,94,0.18)",
    transition: "opacity .15s, transform .1s",
  },
  muted: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, fontFamily: fonts.sans,
    background: tok.stone100, color: tok.stone800, border: `1px solid ${tok.stone200}`,
    borderRadius: 12, cursor: "pointer", transition: "opacity .15s, transform .1s",
  },
  danger: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, fontFamily: fonts.sans,
    background: tok.rose, color: "#fff", border: "none",
    borderRadius: 12, cursor: "pointer",
    boxShadow: "0 10px 24px rgba(192,57,43,0.18)",
    transition: "opacity .15s, transform .1s",
  },
};
