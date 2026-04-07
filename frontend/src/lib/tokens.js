export const tok = {
  cream:         "#FDFCF9",
  stone50:       "#F7F5F0",
  stone100:      "#EDEBE4",
  stone200:      "#D9D6CC",
  stone400:      "#9E9B91",
  stone600:      "#6B6860",
  stone800:      "#2E2D29",
  gold:          "#C9A84C",
  goldLight:     "#F5EDD6",
  goldBorder:    "#E8D5A0",
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
  boxShadow: "0 1px 4px rgba(46,45,41,0.06), 0 4px 16px rgba(46,45,41,0.04)",
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
    boxShadow: `0 2px 8px ${tok.emerald}40`,
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
    boxShadow: `0 2px 8px ${tok.rose}40`,
    transition: "opacity .15s, transform .1s",
  },
};
