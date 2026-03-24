# Fetemi Content Manager

A premium, competition-ready AI-powered content management platform for marketing agencies. This application provides a complete workflow for content submission, AI-generated draft review, and multi-platform content adaptation.

## ✨ Features

### 🎯 Content Intake Page (`/intake`)
- Submit content ideas or URLs for AI analysis
- Clean, modern form with real-time validation
- Success confirmation with email delivery notification
- Responsive design optimized for all devices

### 📋 Draft Review Page (`/draft-review`)
- Review 3 AI-generated SEO-optimized article drafts
- Beautiful card-based layout with markdown rendering
- Expandable content previews
- SEO keyword warnings
- Select the best draft or reject all with feedback
- Confirmation dialogs to prevent accidental actions

### 🎬 Adaptation Review Page (`/adaptation-review`)
- Review platform-specific adaptations (LinkedIn, X/Twitter, Email)
- Tab-based interface with status indicators
- Approve, reject, or schedule each platform independently
- Real-time character count validation
- Reject or schedule panels with smooth animations
- Comprehensive confirmation modal

### 📊 Dashboard Page (`/dashboard`)
- Real-time overview of all submissions and their status
- Summary statistics (Total, Published, Awaiting, Rejected)
- Detailed ideas table with platform status indicators
- Pipeline progress visualization
- Email-based manager authentication
- Auto-refresh every 60 seconds
- Quick action buttons for draft and adaptation reviews

## 🎨 Design System

### Color Palette
- **Primary**: Modern Blue (#3B82F6)
- **Accent**: Teal (#10B981)
- **Destructive**: Red (#EF4444)
- **Neutrals**: Clean white, grays, and dark backgrounds

### Typography
- **Font**: Geist (clean, modern sans-serif)
- **Headings**: Bold, large sizes for hierarchy
- **Body**: Readable 16px base with proper line heights

### Animations
- Smooth transitions on all interactive elements
- Slide-in animations for page content (500ms ease-out)
- Fade animations for overlays (300ms ease-in-out)
- Spinner animations for loading states
- Shimmer animations for skeleton loaders

## 🚀 Getting Started

### Installation
```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Environment Variables
No environment variables are required for local development. The application uses:
- n8n webhooks for backend communication
- localStorage for client-side state persistence
- Next.js built-in routing

## 📱 Responsive Design

All pages are fully responsive with:
- Mobile-first approach
- Touch-friendly buttons and inputs
- Flexible grid layouts
- Optimized typography for small screens
- Adapted navigation for mobile devices

## 🔐 Security

- Input validation on all forms
- URL validation for article submissions
- Email format validation
- Minimum character requirements for feedback
- Secure query parameter handling
- No sensitive data stored in localStorage (only email)

## 🎯 Pages

### `/` - Home Redirect
Automatically redirects to `/intake`

### `/intake` - Content Submission
Primary entry point for content managers to submit ideas or URLs

### `/draft-review?idea_id={id}` - Draft Selection
Review and select from 3 AI-generated drafts

### `/adaptation-review?idea_id={id}&resume_url={url}&submitted_by={email}` - Platform Adaptations
Review and approve platform-specific content adaptations

### `/dashboard` - Manager Dashboard
Comprehensive view of all submissions and their status

## 📦 Dependencies

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with hooks
- **Tailwind CSS 4**: Utility-first CSS
- **Shadcn/ui**: Pre-built accessible components
- **Lucide React**: Beautiful SVG icons
- **React Markdown**: Markdown rendering
- **Zod**: TypeScript-first schema validation

## 🔄 Workflow

1. **Submit**: Manager submits content idea or URL via `/intake`
2. **Generate**: AI generates 3 SEO-optimized drafts (2-3 minutes)
3. **Review Drafts**: Manager reviews and selects best draft at `/draft-review`
4. **Adapt**: AI creates LinkedIn, X, and Email versions
5. **Review Adaptations**: Manager approves, rejects, or schedules each platform
6. **Publish**: Approved content is published immediately or scheduled
7. **Track**: Manager monitors all submissions via `/dashboard`

## 🎯 Competition Ready

This application features:
- ✅ Professional, modern UI
- ✅ Smooth animations and transitions
- ✅ Responsive mobile design
- ✅ Accessible components (WCAG compliant)
- ✅ Fast loading with optimizations
- ✅ Error handling and edge cases
- ✅ Clean, maintainable code
- ✅ Comprehensive form validation

## 📈 Performance

- Optimized images and assets
- Code splitting with Next.js
- Minimal JavaScript bundle
- CSS-in-JS with Tailwind
- Lazy loading for modals and panels
- Efficient state management

## 🤝 API Integration

The application integrates with n8n webhooks:
- `POST /content-intake` - Submit content
- `GET /get-drafts` - Fetch draft options
- `POST /draft-selected` - Select or reject drafts
- `GET /get-adaptations` - Fetch platform adaptations
- `POST /re-adapt` - Request new adaptations
- `GET /get-dashboard` - Fetch manager dashboard

## 📝 Form Validation

All forms include:
- Real-time validation feedback
- Inline error messages
- Disabled submit until valid
- Minimum character requirements
- Format validation (email, URL)
- Character count indicators

## 🎨 Customization

The design system is fully themeable:
- Edit CSS variables in `app/globals.css`
- Modify Tailwind config in `tailwind.config.ts`
- Update color tokens for consistent theming
- Extend animations as needed

## 📄 License

Created with v0.app

## 🚀 Deployment

Deploy to Vercel with one click:
```bash
vercel deploy
```

Or build locally:
```bash
pnpm build
pnpm start
```

---

Built with ❤️ for the Fetemi platform
