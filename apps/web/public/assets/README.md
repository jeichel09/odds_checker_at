# 📁 Static Assets Structure

This directory contains all static assets for the Austrian Sportwetten Quoten website.

## 📂 Directory Structure

```
/public/assets/
├── logos/
│   ├── bookmakers/          # Bookmaker logos (SVG/PNG)
│   ├── leagues/             # Football league logos
│   └── teams/               # Team logos and crests
├── banners/
│   ├── advertising/         # Third-party advertising banners
│   └── promotional/         # Site promotional banners
├── icons/
│   ├── sports/             # Sports-related icons
│   └── ui/                 # UI icons and symbols
└── images/
    ├── flags/              # Country flags
    └── backgrounds/        # Background images

```

## 🎨 **Asset Guidelines**

### **Bookmaker Logos** (`/logos/bookmakers/`)
- **Format**: SVG preferred, PNG as fallback
- **Naming**: `{bookmaker-name}.{ext}` (e.g., `tipp3.svg`, `win2day.png`)
- **Size**: 120x60px optimal, maintain aspect ratio
- **Background**: Transparent preferred
- **Files needed**:
  - `win2day.svg`
  - `tipp3.svg`
  - `bet365.svg`
  - `bwin.svg`
  - `interwetten.svg`
  - `tipico.svg`
  - `betway.svg`
  - `admiral.svg`
  - `neo-bet.svg`
  - `tipwin.svg`
  - `mozzart.svg`
  - `merkur-bets.svg`
  - `rabona.svg`
  - `bet-at-home.svg`
  - `lottoland.svg`

### **League Logos** (`/logos/leagues/`)
- **Format**: SVG preferred
- **Naming**: `{league-name}.svg`
- **Austrian Leagues**:
  - `austrian-bundesliga.svg`
  - `austrian-2-liga.svg`
- **International Leagues**:
  - `premier-league.svg`
  - `bundesliga.svg`
  - `serie-a.svg`
  - `la-liga.svg`
  - `champions-league.svg`
  - `europa-league.svg`

### **Team Logos** (`/logos/teams/`)
- **Format**: SVG preferred, PNG fallback
- **Naming**: `{team-name}.{ext}`
- **Austrian Teams**:
  - `rb-salzburg.svg`
  - `rapid-wien.svg`
  - `austria-wien.svg`
  - `sturm-graz.svg`
  - `lask.svg`
  - `wolfsberg.svg`
  - `tsv-hartberg.svg`
  - `wsg-tirol.svg`
  - `austria-klagenfurt.svg`
  - `scr-altach.svg`

### **Advertising Banners** (`/banners/advertising/`)
- **Format**: JPG/PNG/SVG
- **Standard Sizes**:
  - Header banner: 728x90px
  - Sidebar banner: 300x250px
  - Footer banner: 970x90px
- **Naming**: `{partner}-{size}.{ext}`

### **UI Icons** (`/icons/ui/`)
- **Format**: SVG only
- **Size**: 24x24px default
- **Style**: Consistent line weight (1.5px)
- **Files needed**:
  - `star.svg` (favorites)
  - `bell.svg` (notifications)
  - `trend-up.svg` (best odds)
  - `shield.svg` (security)
  - `check-circle.svg` (verified)

### **Country Flags** (`/images/flags/`)
- **Format**: SVG
- **Size**: 32x24px (4:3 ratio)
- **Files needed**:
  - `austria.svg`
  - `germany.svg`
  - `england.svg`
  - `italy.svg`
  - `spain.svg`

## 🔄 **Usage in Components**

### **Next.js Image Component**
```tsx
import Image from 'next/image'

// Bookmaker logo
<Image
  src="/assets/logos/bookmakers/tipp3.svg"
  alt="tipp3"
  width={60}
  height={30}
  className="object-contain"
/>

// Team logo
<Image
  src="/assets/logos/teams/rb-salzburg.svg"
  alt="RB Salzburg"
  width={32}
  height={32}
/>
```

### **Background Images**
```tsx
// In Tailwind classes
<div className="bg-[url('/assets/images/backgrounds/hero-bg.jpg')]">

// In CSS
background-image: url('/assets/images/backgrounds/stadium.jpg');
```

### **Responsive Images**
```tsx
// Multiple sizes for different breakpoints
<Image
  src="/assets/banners/promotional/welcome-banner.jpg"
  alt="Welcome"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  width={970}
  height={250}
/>
```

## 📋 **Asset Optimization**

### **SVG Optimization**
- Remove unnecessary metadata
- Optimize paths and shapes
- Use consistent naming conventions
- Ensure scalability

### **Image Compression**
- PNG: Use TinyPNG or similar
- JPG: 85% quality for photos
- WebP: Modern format for better compression

### **Performance**
- Use Next.js Image component for automatic optimization
- Implement lazy loading for below-the-fold images
- Consider using blur placeholders

## 🎨 **Color Coordination**

All logos and graphics should work well with our Austrian Classic palette:
- **Primary Red**: #DC2626
- **Charcoal**: #1F2937
- **Golden Amber**: #F59E0B
- **Background**: #F8FAFC

## 📱 **Responsive Considerations**

- Provide multiple sizes for different screen densities
- Use SVG for icons and simple graphics (infinitely scalable)
- Test logo visibility on both light and dark backgrounds
- Ensure minimum touch target sizes (44x44px) for interactive elements

## 🔒 **Legal Considerations**

- Only use officially licensed logos with permission
- Maintain trademark compliance
- Include proper attribution where required
- Keep license documentation for purchased assets

---

**Note**: This structure follows industry best practices for sports betting and financial comparison websites, ensuring professional presentation and optimal performance.