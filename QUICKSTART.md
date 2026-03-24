# ⚡ Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Start Development Server
```bash
pnpm dev
```

### Step 3: Open in Browser
Navigate to `http://localhost:3000`

---

## 📍 Page Routes

| URL | Purpose | Status |
|-----|---------|--------|
| `/` | Home redirect | Auto → `/intake` |
| `/intake` | Submit content | ✅ Ready |
| `/draft-review?idea_id={id}` | Review drafts | ✅ Ready |
| `/adaptation-review?idea_id={id}&resume_url={url}&submitted_by={email}` | Review adaptations | ✅ Ready |
| `/dashboard` | View submissions | ✅ Ready |

---

## 🎯 Testing the Application

### Test Flow 1: Intake Form
1. Go to `/intake`
2. Choose "Content Idea"
3. Enter a test idea (10+ characters)
4. Enter email: `test@example.com`
5. Enter name: `Test User`
6. Click "Generate Drafts"
7. See success message

### Test Flow 2: Draft Review (Mock)
1. Go to `/draft-review?idea_id=test123`
2. See loading state briefly
3. View 3 draft cards
4. Expand "Read full draft"
5. Select a draft
6. Confirm selection
7. See success message

### Test Flow 3: Dashboard
1. Go to `/dashboard`
2. Enter email: `test@example.com`
3. Click "Load My Dashboard"
4. See empty state (no data initially)
5. Click "Change Email" to reset

---

## 🎨 Design Features

### Colors Used
- **Blue (#3B82F6)**: Primary actions
- **Teal (#10B981)**: Accents, success
- **Red (#EF4444)**: Destructive actions
- **Gray**: Neutrals and borders

### Animations
- **Slide In Up**: Page load (500ms)
- **Slide In Down**: Header (500ms)
- **Fade In**: Overlays (300ms)
- **Shimmer**: Loading skeletons (2s loop)

### Responsive Breakpoints
- **Mobile**: < 640px (single column)
- **Tablet**: 640-1024px (2 columns)
- **Desktop**: > 1024px (3+ columns)

---

## 📝 Form Validation Rules

### Intake Form
| Field | Min Length | Format | Required |
|-------|-----------|--------|----------|
| Idea/URL | 10 chars | idea or https://url | Yes |
| Email | - | valid@email.com | Yes |
| Name | 1 char | text | Yes |

### Draft Review
| Field | Min Length | Max Length |
|-------|-----------|-----------|
| Rejection reason | 20 chars | unlimited |

### Adaptation Review
| Field | Min Length | Max Length |
|-------|-----------|-----------|
| Rejection reason | 20 chars | unlimited |
| Schedule | - | future datetime (15+ min) |

---

## 🔧 Build Commands

```bash
# Development
pnpm dev              # Start dev server (hot reload)

# Production
pnpm build            # Create production build
pnpm start            # Run production server

# Linting
pnpm lint             # Run ESLint
```

---

## 📦 Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles + animations
│   ├── page.tsx                # Home redirect
│   ├── intake/
│   │   └── page.tsx            # Intake form
│   ├── draft-review/
│   │   └── page.tsx            # Draft review
│   ├── adaptation-review/
│   │   └── page.tsx            # Adaptation review
│   └── dashboard/
│       └── page.tsx            # Dashboard
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── theme-provider.tsx      # Theme support
├── lib/
│   └── utils.ts                # Utility functions
├── hooks/
│   └── use-mobile.ts           # Mobile detection
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind config
├── README.md                   # Full documentation
├── FEATURES.md                 # Feature list
├── PAGES.md                    # Page details
├── STYLING.md                  # Design system
├── COMPETITION_READY.md        # Summary
└── QUICKSTART.md              # This file
```

---

## 🎯 Key Features at a Glance

### ✨ Intake Form
- Radio toggle for Idea/URL
- Real-time validation
- Loading spinner
- Success confirmation
- Error messages

### 📋 Draft Review
- 3 beautiful cards
- Expandable content
- SEO warnings
- Selection modal
- Reject all option

### 🎬 Adaptation Review
- 3 tabs (LinkedIn, X, Email)
- Approve/Reject/Schedule
- Character counting
- Status indicators
- Confirmation modal

### 📊 Dashboard
- Summary cards
- Complete table
- Auto-refresh (60s)
- Action buttons
- Pipeline visualization

---

## 🌙 Dark Mode

The app automatically supports dark mode based on system preferences. Users can toggle in their browser settings:
- **Respects**: `prefers-color-scheme`
- **CSS Variables**: Automatically adjust
- **No JS Required**: Pure CSS dark mode

---

## 📱 Responsive Design

All pages are mobile-first and responsive:
- **Mobile**: Single column, full width
- **Tablet**: 2 columns, adjusted spacing
- **Desktop**: 3-4 columns, optimal layout

Test on mobile by:
1. Opening dev tools (F12)
2. Clicking device toggle
3. Selecting iPhone/Android size

---

## 🔌 API Integration Points

The app connects to these n8n webhooks:

```
POST https://cohort2pod2.app.n8n.cloud/webhook/content-intake
GET  https://cohort2pod2.app.n8n.cloud/webhook/get-drafts
POST https://cohort2pod2.app.n8n.cloud/webhook/draft-selected
GET  https://cohort2pod2.app.n8n.cloud/webhook/get-adaptations
POST https://cohort2pod2.app.n8n.cloud/webhook/re-adapt
GET  https://cohort2pod2.app.n8n.cloud/webhook/get-dashboard
```

**Note**: These are external APIs. Ensure they're accessible in your environment.

---

## 🐛 Debugging

### Browser Console
Check the browser console (F12) for:
- API response errors
- Form validation messages
- Navigation issues

### Network Tab
Monitor API calls:
1. Open DevTools → Network
2. Perform an action
3. Check request/response

### React DevTools
Install React DevTools browser extension to:
- Inspect component tree
- Check prop values
- Monitor state changes

---

## 📖 Documentation Files

### README.md
Complete project overview, features, and setup instructions.

### FEATURES.md
Detailed feature list with implementation details.

### PAGES.md
Page structure, layouts, and component breakdown.

### STYLING.md
Complete design system, colors, animations, and CSS.

### COMPETITION_READY.md
Summary of all built features and quality metrics.

### QUICKSTART.md
This file - quick reference guide.

---

## ✅ Checklist Before Deployment

- [ ] All pages working in browser
- [ ] Forms submit without errors
- [ ] Responsive design tested on mobile
- [ ] Dark mode works correctly
- [ ] Animations are smooth
- [ ] Error messages display properly
- [ ] No console errors
- [ ] Build completes successfully

---

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel deploy
```

### Option 2: GitHub Integration
1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploys on push

### Option 3: Manual Upload
1. Run `pnpm build`
2. Upload to Vercel dashboard

---

## 🤔 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
pnpm dev --port 3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
pnpm store prune
pnpm install
```

### Hot Reload Not Working
1. Clear `.next` folder
2. Restart dev server
3. Hard refresh browser (Ctrl+Shift+R)

### Styling Not Loading
1. Check tailwind.config.ts
2. Verify globals.css imports
3. Clear browser cache
4. Restart dev server

---

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check documentation files
3. Verify API endpoints are accessible
4. Check network tab for failed requests

---

## 🎓 Learning Resources

### Tailwind CSS
- https://tailwindcss.com/docs

### Next.js 16
- https://nextjs.org/docs

### React 19
- https://react.dev

### shadcn/ui
- https://ui.shadcn.com

---

## 📈 Performance Tips

### Development
- Use Chrome DevTools Performance tab
- Check Lighthouse scores
- Monitor bundle size

### Production
- Images are optimized
- CSS is minified
- JavaScript is split
- Caching is enabled

---

## 🎉 You're Ready!

Start the dev server with `pnpm dev` and explore all the features. The app is fully functional and ready to impress! 🏆

---

**Last Updated**: March 2026
**Status**: ✅ Production Ready
**Performance**: 🚀 Optimized
**Design**: ✨ Competition Ready
