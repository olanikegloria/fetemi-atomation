# 📄 Fetemi Content Manager - Page Structure

## Page Overview

```
/                          → Redirects to /intake
├── /intake                → Content Submission Form
├── /draft-review          → Draft Selection & Review
├── /adaptation-review     → Platform Adaptations Review
└── /dashboard             → Manager Dashboard
```

---

## 1. 🏠 Home Page (`/`)

**Purpose**: Entry point that redirects to intake

**Route Handler**:
```
/ → /intake (automatic redirect)
```

---

## 2. 📝 Intake Page (`/intake`)

**Purpose**: Content submission form for marketing managers

### Layout
```
┌─────────────────────────────────────────┐
│  Fetemi Content Manager                 │
│  Submit your content idea & generate    │
│  three optimized article drafts         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FORM CARD                              │
│                                         │
│  I have a...                            │
│  ◯ Content Idea  ◉ URL                 │
│                                         │
│  Describe your content idea             │
│  ┌──────────────────────────────────┐   │
│  │ Enter your idea...               │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Your email address                     │
│  ┌──────────────────────────────────┐   │
│  │ you@example.com                  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Your name                              │
│  ┌──────────────────────────────────┐   │
│  │ Your Name                        │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [Generate Drafts]                      │
│                                         │
└─────────────────────────────────────────┘
```

### Features
- Input type toggle (Idea ↔ URL)
- Dynamic field switching
- Real-time validation
- Email/Name validation
- Loading spinner on submit
- Success confirmation screen
- Error handling with retry

### Form Fields
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Input Type | Radio | - | Yes |
| Content/URL | Textarea/Input | 10+ chars / https:// | Yes |
| Email | Email | Valid email format | Yes |
| Name | Text | Non-empty | Yes |

---

## 3. 📋 Draft Review Page (`/draft-review`)

**Purpose**: Review and select from 3 AI-generated article drafts

**URL Parameters**: `?idea_id={id}`

### Layout
```
┌─────────────────────────────────────────┐
│  Review Your Drafts                     │
│  Select the draft that best matches...  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  DRAFT CARD 1                           │
│                                         │
│  [Angle A]  Angle Description           │
│  Article Title                          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Article preview (300 chars)...    │  │
│  │ [Read full draft ▼]               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Word count: 2,450  Keywords: AI, ML   │
│  ⚠ Primary keyword not in first 100    │
│                                         │
│  [Use This Draft]                       │
│                                         │
└─────────────────────────────────────────┘

(Draft 2 & 3 cards...)

┌─────────────────────────────────────────┐
│  None of these work for me  ▼           │
│                                         │
│  Why are you rejecting all drafts?      │
│  ┌───────────────────────────────────┐  │
│  │ Enter your reason (20+ chars)     │  │
│  └───────────────────────────────────┘  │
│  n/20 minimum                           │
│                                         │
│  [Cancel] [Reject All Drafts]           │
│                                         │
└─────────────────────────────────────────┘
```

### Features
- 3 draft cards in grid
- Expandable content with markdown
- SEO keyword warnings
- Single selection (radio style)
- Selection confirmation modal
- Reject all with reason
- Error handling for missing data

### States
- **Loading**: 3 skeleton cards with shimmer
- **Error**: Full-page error message
- **Invalid Link**: Error with home button
- **Already Reviewed**: Disabled state with message
- **Success**: Confirmation screen

---

## 4. 🎬 Adaptation Review Page (`/adaptation-review`)

**Purpose**: Review and approve platform-specific content adaptations

**URL Parameters**: `?idea_id={id}&resume_url={url}&submitted_by={email}`

### Layout
```
┌─────────────────────────────────────────┐
│  Review Your Content Adaptations        │
│  Make decisions on all three platforms  │
└─────────────────────────────────────────┘

TAB NAVIGATION:
│ LinkedIn • X (Twitter) • Email 📧     │
└─────────────────────────────────────────┘

LINKEDIN TAB:
┌─────────────────────────────────────────┐
│  LinkedIn Post                          │
│  ┌───────────────────────────────────┐  │
│  │ LinkedIn content...               │  │
│  └───────────────────────────────────┘  │
│  1200 / 1300 characters ✓               │
│                                         │
│  [✅ Approve] [❌ Reject] [🕐 Schedule]  │
│                                         │
│  REJECT PANEL (Slide In):               │
│  Why are you rejecting?                 │
│  ┌───────────────────────────────────┐  │
│  │ Enter reason (20+ chars)          │  │
│  └───────────────────────────────────┘  │
│  [Cancel] [Confirm Rejection]           │
│                                         │
└─────────────────────────────────────────┘

(X Tab & Email Tab with similar layouts...)

SUBMIT SECTION:
┌─────────────────────────────────────────┐
│  Decisions made: 3 of 3                 │
│  LinkedIn ✓  X ✓  Email ✓               │
│                                         │
│  [Confirm All Decisions]                │
│  [None of these — request new]          │
│                                         │
└─────────────────────────────────────────┘

CONFIRMATION MODAL:
┌─────────────────────────┐
│ Confirm All Decisions   │
│                         │
│ LinkedIn: Approve       │
│ X: Schedule            │
│ Email: Reject          │
│                         │
│ [Go Back] [Submit]     │
└─────────────────────────┘
```

### Tab Components
Each tab (LinkedIn, X, Email) contains:
- Content display (textarea or HTML)
- Character count with color coding
- Thread indicator for X
- Three action buttons: Approve / Reject / Schedule
- Slide-in panels for reject/schedule

### Reject Panel
- Textarea for reason (min 20 chars)
- Character counter
- Cancel/Confirm buttons
- Disabled until valid

### Schedule Panel
- DateTime input with 15-min minimum
- Cancel/Confirm buttons
- Disabled until datetime selected

### Features
- Tab-based platform navigation
- Status indicators (dots with color)
- Real-time decision tracking
- Progress indicator (X of 3 decisions)
- Smooth panel animations
- HTML rendering for email body
- Re-adaptation option

---

## 5. 📊 Dashboard Page (`/dashboard`)

**Purpose**: Real-time overview of all content submissions

**Features**:
- Email-based authentication (localStorage)
- Auto-refresh every 60 seconds
- Summary statistics
- Detailed ideas table
- Quick action buttons

### Layout
```
┌──────────────────────────────────────────┐
│  Dashboard                               │
│  Logged in as: user@example.com          │
│                    [Change Email]        │
│                    [+ New Idea] [↻ Refresh]
└──────────────────────────────────────────┘

SUMMARY CARDS:
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Total   │ │Published │ │ Awaiting │ │ Rejected │
│   12     │ │    8     │ │    2     │ │    2     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

IDEAS TABLE:
┌────────────────────────────────────────────────────────┐
│ Submitted │ Idea/URL │ Status │ LI │ X │ Email │ Action│
├────────────────────────────────────────────────────────┤
│ 2h ago    │ [Idea]   │ ✓ Done │ ✓  │ ✓ │ ✓     │       │
│           │ How to   │        │    │   │       │       │
│           │ use AI   │        │    │   │       │       │
├────────────────────────────────────────────────────────┤
│ 1h ago    │ [URL]    │ ⏳ Wait│ —  │ — │ —     │Review │
│           │ https:// │        │    │   │       │Drafts │
│           │ article  │        │    │   │       │ →     │
├────────────────────────────────────────────────────────┤
│ 30m ago   │ [Idea]   │ ❌ Error│    │   │       │       │
│           │ Content  │        │    │   │       │       │
│           │ planning │        │    │   │       │       │
└────────────────────────────────────────────────────────┘

PIPELINE VISUALIZATION:
Submitted > Drafts > Draft Review > Adaptations > Published
████████  ████████  ░░░░░░░░░░    ░░░░░░░░░░    ░░░░░░░░░░
```

### Email Input Screen
```
┌──────────────────────────┐
│  Your Dashboard          │
│                          │
│  Enter your email        │
│  ┌────────────────────┐  │
│  │ you@example.com    │  │
│  └────────────────────┘  │
│                          │
│  [Load My Dashboard]     │
│                          │
└──────────────────────────┘
```

### Summary Cards
| Card | Color | Shows |
|------|-------|-------|
| Total Ideas | Blue | Count of all submissions |
| Published | Green | Successfully published count |
| Awaiting Review | Amber | Pending manager review |
| Rejected/Expired | Red | Failed or expired ideas |

### Table Columns
| Column | Shows | Format |
|--------|-------|--------|
| Submitted | Relative time | "2h ago" with tooltip |
| Idea/URL | Content summary | Badge + truncated text |
| Status | Current stage | Color-coded pill |
| LinkedIn | Platform status | ✓/✗/— icons |
| X | Platform status | ✓/✗/— icons |
| Email | Platform status | ✓/✗/— icons |
| Action | Quick action | Context-aware button |

### Row Colors
- **Awaiting**: Light amber background
- **Published**: Light green background
- **Error/Expired**: Light red background
- **Default**: Card white background

### Features
- Email persistence in localStorage
- Auto-refresh every 60 seconds
- Manual refresh button with spinner
- "Last updated" timestamp
- "Change email" link
- "New Idea" button
- Pipeline progress bars
- Status-based row highlighting

---

## 🔄 Navigation Flow

```
User Journey:

1. START
   ↓
2. /intake
   ├─ Submit Idea or URL
   ├─ Receive email with draft review link
   ↓
3. /draft-review?idea_id={id}
   ├─ Review 3 AI drafts
   ├─ Select best draft
   ├─ Receive email with adaptation review link
   ↓
4. /adaptation-review?idea_id={id}&...
   ├─ Review LinkedIn, X, Email versions
   ├─ Approve/Reject/Schedule each
   ├─ Receive confirmation email
   ↓
5. /dashboard
   └─ Monitor all submissions
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)
- Single column layouts
- Full-width cards
- Stacked form fields
- Compact table (horizontal scroll if needed)
- Mobile navigation

### Tablet (640px - 1024px)
- 2-column grids where appropriate
- Adjusted spacing
- Readable table

### Desktop (> 1024px)
- 3-4 column grids
- Full table views
- Optimal whitespace

---

## 🎯 Accessibility Features

All pages include:
- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ Form labels associated with inputs
- ✅ Focus management
- ✅ Keyboard navigation
- ✅ Color contrast compliance
- ✅ Screen reader support
- ✅ ARIA labels where needed

---

**Total Pages**: 5 (+ redirect)
**Form Pages**: 2 (intake, adaptations)
**Review Pages**: 2 (drafts, adaptations)
**Dashboard Pages**: 1
**Status**: ✅ Complete and Production-Ready
