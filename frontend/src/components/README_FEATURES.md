# Features Section - Complete Integration Guide

## 📋 Overview

The **FeaturesSection** component displays AptHive's core features in a stunning **staggered alternating layout**, with each feature positioned left/right on different rows.

## 🎯 What Was Changed

### New/Updated Files:
1. **FeaturesSection.jsx** - Container component with 5 features
2. **FeatureCard.jsx** - Reusable card with alternating layout
3. **LandingPage.jsx** - Imports FeaturesSection + exports animation components

### Removed:
- Old `FeaturesShowcase()` logic (replaced with FeaturesSection)

---

## 🚀 How It Works

### Features Displayed (Staggered Layout):
```
Row 1:  TEXT (Left)      ↔  Animation (Right)      - Visitor Management 🔐
Row 2:  Animation (Left) ↔  TEXT (Right)           - Real-Time Alerts 🔔
Row 3:  TEXT (Left)      ↔  Animation (Right)      - Community Polls 🗳️
Row 4:  Animation (Left) ↔  TEXT (Right)           - Events & Amenities 📅
Row 5:  TEXT (Left)      ↔  Animation (Right)      - Announcements 📢
```

### Key Features:
✅ **Alternating Layout** - Uses CSS `order` property to flip sides  
✅ **Live Animations** - Real animated components from LandingPage  
✅ **Scroll Animations** - Staggered fade-in with `whileInView`  
✅ **Responsive** - Adapts to tablet/mobile (stack vertically)  
✅ **Blue Border Highlight** - First feature has prominent styling  

---

## 📱 Responsive Breakpoints

| Screen Size | Layout | Changes |
|------------|--------|---------|
| Desktop (>960px) | 2-column grid | Text ↔ Animation alternating |
| Tablet (960px-640px) | 1-column | Stack vertically, remove order flip |
| Mobile (<640px) | 1-column | Larger gaps, adjusted padding |

---

## 🛠️ Using FeaturesSection

### In a Page:
```jsx
import FeaturesSection from '../components/FeaturesSection';

export default function MyPage() {
  return (
    <div>
      {/* Other components */}
      <FeaturesSection />
      {/* Other components */}
    </div>
  );
}
```

### Current Usage:
Already integrated in **LandingPage.jsx** (replaces old FeaturesShowcase)

---

## 🎨 Customization

### Edit Feature Data (in FeaturesSection.jsx):
```jsx
const FEATURES_DATA = [
  {
    id: 1,
    title: "Feature Name",
    description: "Brief description...",
    icon: "🎯",
    color: "#2563EB",
    AnimationPanel: MyAnimComponent,
    layout: "text-left", // or "text-right"
    highlighted: true, // only first feature
  },
  // ... more features
];
```

### Animation Components Must:
- Be React components
- Accept no props
- Return JSX rendering the animation
- Can be class or functional components

---

## 🔧 Component Props

### FeaturesSection
No props - self-contained with hardcoded features

### FeatureCard
| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Feature name |
| `description` | string | Feature description |
| `icon` | string | Emoji or icon |
| `color` | string | Hex color code |
| `AnimationPanel` | React Component | Animation component to render |
| `layout` | "text-left" \| "text-right" | Text position |
| `highlighted` | boolean | Blue border styling |
| `index` | number | For stagger animation delay |

---

## 🎬 Animation Exports from LandingPage

The following animation components are exported and used by FeaturesSection:

```jsx
export {
  FeatVisitorAnim,      // Visitor approval demo
  FeatAlertsAnim,       // Real-time notifications
  FeatPollsAnim,        // Community voting
  FeatEventsAnim,       // Amenity booking
  FeatAnnouncementsAnim, // News updates
}
```

### Using These Animations Elsewhere:
```jsx
import { FeatVisitorAnim } from '../pages/LandingPage';

export default function MyComponent() {
  return <FeatVisitorAnim />;
}
```

---

## ✅ Build & Deploy

Build passes: ✓ (3 components compile successfully)

Run build:
```bash
npm run build
```

Run dev:
```bash
npm run dev
```

---

## 📝 Notes

- **CSS Pulse Animation**: Live badge pulsates with `@keyframes pulse`
- **Stagger Delay**: Each card animates with 0.1s delay difference
- **Scroll Trigger**: Uses Framer Motion's `whileInView` for scroll-based animations
- **PWA Build Note**: Build has a pre-existing warning about apartment.png size (10.9MB), unrelated to this feature

---

## 🐛 Troubleshooting

### Feature cards not alternating on desktop?
→ Check browser window > 960px width

### Animations not showing?
→ Ensure AnimationPanel components are exported from LandingPage

### Responsive not working?
→ Check CSS media queries in FeatureCard.jsx

