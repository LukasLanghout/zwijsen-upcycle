# Zwijsen Upcycle: UI/UX Verbetering Plan

## Overzicht
Dit document beschrijft gestructureerde verbeteringen aan de Zwijsen Upcycle webapp gebaseerd op moderne design principes, pedagogische best practices, en Zwijsen brand guidelines.

---

## 1. TYPOGRAFIE & BRAND

### Huige Status
- Gebruikt Inter font (Google Fonts)
- Zwijsen documenten specificeren Calibri
- Inconsistente font-scaling

### Verbeteringen
1. **Font Stack updaten naar Calibri**
   - Primaire font: Calibri fallback naar system fonts
   - Secundair: Inter voor verdere support

2. **Betere typografische hiërarchie**
   - H1: 36px (bold) - Pagina titels
   - H2: 28px (bold) - Sectie koppen
   - H3: 20px (semibold) - Subkoppen
   - Body: 16px (regular) - Standaard tekst
   - Small: 14px (regular) - Metadata
   - Caption: 12px (regular) - Hints, labels

3. **Line-height improvements**
   - Koppen: 1.2
   - Body tekst: 1.6 (betere leesbaarheid)
   - Forms: 1.5

4. **Letter spacing**
   - Koppen: 0.5% (professioneler)
   - Body: 0.2% (subtiel)

---

## 2. KLEUR & VISUELE HIËRARCHIE

### Current Palette
- Primary: #A81D7B (Magenta)
- Accent: #5BAD6F (Groen)
- Warning: #F07D00 (Oranje)
- Neutral grays: undefined

### Verbeteringen
1. **Extended Color System**
   ```
   Primary (#A81D7B):
   - 50: #F8D5EC (lightest)
   - 100: #F3D6EB
   - 200: #E8AED7
   - 300: #D785C3
   - 400: #C75CB5
   - 500: #A81D7B (main)
   - 600: #8B1864
   - 700: #6E1150
   - 800: #52093C
   - 900: #3A0629
   
   Accent (#5BAD6F):
   - 50: #F0F7F4
   - 100: #E1EFE9
   - 200: #C3DED3
   - 300: #A5CDBD
   - 400: #86BCA7
   - 500: #5BAD6F (main)
   - 600: #4A9B5D
   - 700: #39894B
   - 800: #287739
   - 900: #1A5227
   
   Warning (#F07D00):
   - 50: #FFF8F0
   - 100: #FFE8D1
   - 200: #FFD0A3
   - 300: #FFB875
   - 400: #FFA047
   - 500: #F07D00 (main)
   - 600: #D66800
   - 700: #BC5300
   - 800: #A24100
   - 900: #882D00
   ```

2. **Semantic Colors**
   - Success: #5BAD6F (groen)
   - Error: #EF4444 (rood, standaard)
   - Info: #3B82F6 (blauw)
   - Neutral: #6B7280 (grijs)

3. **Contrast Requirements**
   - Tekst op achtergrond: minimaal WCAG AA (4.5:1)
   - UI componenten: minimaal WCAG AA (3:1)

---

## 3. SPATIËRING & LAYOUT

### Current Issues
- Inconsistente gapping (gap-4, gap-6 door elkaar)
- Onvoldoende whitespace
- Scherm voelt vol

### 8px Grid System
```
0:   0px
1:   8px
2:   16px
3:   24px
4:   32px
5:   40px
6:   48px
7:   56px
8:   64px
```

### Container & Sections
```
- Max-width: 1280px (xl)
- Padding (desktop): 32px (4x)
- Padding (tablet): 24px (3x)
- Padding (mobile): 16px (2x)
- Gap between sections: 48px
- Gap within sections: 32px
```

### Padding voor componenten
- Small: 8px + 16px
- Medium: 16px + 24px (standaard)
- Large: 24px + 32px
- Extra Large: 32px + 48px

---

## 4. INTERACTIEVE COMPONENTEN

### Buttons
**Verbeteringen:**
1. Betere padding: `px-6 py-3` (was: py-2, te klein voor targets)
2. Betere hover states: 
   - Primary: donkerder shade + shadow
   - Secondary: background change
3. Betere focus states: outline + offset
4. Disabled state: gray + cursor-not-allowed
5. Loading state: spinner + tekst

### Form Inputs
**Verbeteringen:**
1. Groter hit area: `py-2.5 px-4` (minimaal 44px hoogte)
2. Betere focus state: outline in primair kleur
3. Error states: rode border + error message
4. Floating labels OR labels boven input
5. Placeholders: grijs, duidelijk
6. Help text: klein, grijs

### Badges & Tags
**Verbeteringen:**
1. Grotere padding: `px-3 py-1.5`
2. Betere kleurkeuze per type
3. Duidelijk onderscheid tussen states

---

## 5. PAGINA: DASHBOARD

### Huige Layout
- Hero section
- Stats cards (3 kolommen)
- Workflow steps (4 kolommen)
- CTA cards (2 kolommen)
- Danger zone

### Verbeteringen
1. **Stats Cards verbeteren:**
   - Groter getal (more prominent)
   - Icon toevoegen per stat
   - Kleine trendline of groei-indicator
   - Betere padding

2. **Workflow diagram:**
   - Verbindingslijnen tussen stappen (SVG)
   - Betere visueel progressie
   - Animatie bij hover

3. **Hero section:**
   - Betere contrast zwischen titel en achtergrond
   - Optional: subtle gradient
   - Betere CTA buttons

4. **Empty state:**
   - Als geen stats: show tips en empty message

---

## 6. PAGINA: BIBLIOTHEEK

### Huige Issues
- Filters zijn inline (veel whitespace verspilled)
- Grid collaps op mobile
- Cards zijn te klein

### Verbeteringen
1. **Betere filter layout:**
   - Option 1: Collapsible sidebar (desktop)
   - Option 2: Horizontal filter bar met scroll (mobile)
   - Selected filters tonen met x button

2. **Betere exercise cards:**
   - Grotere image/preview
   - Betere metadata structuur
   - Duidelijker CTA buttons
   - Status indicator (badge)
   - Hover animation

3. **Pagination/Infinite scroll:**
   - Huige: geen pagination (alle oefeningen tegelijk)
   - Voorstel: infinite scroll of pagination

4. **Empty state:**
   - Betere empty state pagina
   - Tips voor filtering

---

## 7. PAGINA: UPLOAD

### Huige Features
- PDF upload
- Realtime preview
- Progress tracking

### Verbeteringen
1. **Drag-and-drop area:**
   - Groter
   - Betere visuele feedback
   - Animation op hover
   - Alternative: klik om te selecteren

2. **Progress tracking:**
   - Stappen tonen (1. Upload, 2. Render, 3. Extract, 4. Review)
   - Animatie per stap
   - Percentage complete

3. **PDF preview:**
   - Grotere miniaturengrid
   - Pagina selectie
   - Zoom controls

---

## 8. PAGINA: EXERCISE (Interactive)

### Huige Design
- Instruction tekst
- Input veld(en)
- Check/Reset buttons

### Verbeteringen
1. **Betere instructie weergave:**
   - Groter, prominenter
   - Optional: instructie tekst highlighting
   - Hint systeem (?) button

2. **Betere input fields:**
   - Groter (minimaal 44px)
   - Numbpad friendly (mobile)
   - Better focus state
   - Real-time validation feedback

3. **Feedback system:**
   - Correcte antwoord: groene succes state + celebratie animation
   - Fout antwoord: rode error state + helpende feedback
   - Partial credit: geel warning state

4. **Variant selector:**
   - Duidelijkere moeilijkheid levels (visueel)
   - Smooth transition tussen variants
   - "Moeilijker/Makkelijker" buttons

---

## 9. LOADING STATES & SKELETONS

### Verbeteringen
1. **Skeleton screens:**
   - Niet: pulse animation
   - Wel: shimmer animation (meer modern)
   - Per component type

2. **Loading indicators:**
   - Spinner in center of screen
   - Status message ("PDFs verwerken...")
   - Optioneel: progress bar

3. **Fallback states:**
   - Error message met retry button
   - Empty state met CTA

---

## 10. ACCESSIBILITY (A11Y)

### Huige Issues
- Mogelijk contrast issues
- Keyboard navigation niet volledig
- Focus states onduidelijk

### Verbeteringen
1. **Color Contrast:**
   - Test alle text/background combos
   - Minimaal WCAG AA

2. **Keyboard Navigation:**
   - Tab order logisch
   - Focus states duidelijk
   - Skip links (optional)

3. **Screen readers:**
   - Alt text op images
   - ARIA labels op buttons
   - Semantic HTML (button vs div)

4. **Touch targets:**
   - Minimaal 44x44px
   - Goede spacing tussen targets

---

## 11. ANIMATIONS & MICRO-INTERACTIONS

### Subtle Improvements
1. **Button hovers:**
   - Slight scale (1.02x)
   - Shadow increase
   - Smooth transition (150ms)

2. **Input focus:**
   - Glow effect
   - Scale slightly
   - Ring in primair kleur

3. **Card interactions:**
   - Lift effect op hover
   - Shadow increase
   - Smooth transition

4. **Success feedback:**
   - Checkmark animation
   - Confetti (optional)
   - Color transition

5. **Page transitions:**
   - Fade in animations
   - Smooth scroll behavior

---

## 12. MOBILE RESPONSIVENESS

### Breakpoints
- Mobile: 320px - 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: 1024px+ (lg)

### Mobile-specific improvements
1. **Navigation:**
   - Hamburger menu (mobile)
   - Full width on mobile

2. **Layout:**
   - Single column layouts
   - Full-width cards
   - Larger touch targets

3. **Forms:**
   - Full-width inputs
   - Larger buttons
   - Better label positioning

4. **Images:**
   - Responsive images
   - Proper aspect ratios

---

## IMPLEMENTATIE STAPPEN

1. **Tailwind Config updaten** - Fonts, colors, spacing
2. **Globals CSS updaten** - Base styles, utilities
3. **Component Library** - Buttons, inputs, cards
4. **Layout updates** - Pages, containers
5. **Micro-interactions** - Animations, transitions
6. **Testing** - Accessibility, responsive, browser compatibility

---

## DESIGN TOKENS (Tailwind)

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Calibri', 'ui-sans-serif', 'system-ui', ...],
      },
      colors: {
        zwijsen: {
          primary: '#A81D7B',
          accent: '#5BAD6F',
          warning: '#F07D00',
          light: '#F3D6EB',
        }
      },
      spacing: {
        // 8px grid
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      }
    }
  }
}
```

---

## Success Criteria

✅ Modern, educationale design
✅ WCAG AA accessibility compliance
✅ Snelle performance (LCP < 2.5s)
✅ Mobile responsive
✅ Consistent branding
✅ Intuitive navigation
✅ Clear feedback loops
✅ Delightful micro-interactions
