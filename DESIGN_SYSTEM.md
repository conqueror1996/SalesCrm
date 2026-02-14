# Urban Clay CRM - Design System & UI/UX Strategy

## 1. Brand Identity & Aesthetics
**Core Philosophy**: "Sales Weapon" – Fast, Focused, Premium. 
**Emotional Feel**: Serious business, trustworthy, earthy, grounded. Not "techy" or glowing.

### Color Palette
We move away from standard "Software Blue" to a premium Construction/Architecture palette.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Clay Red (Primary)** | `#B94E48` | Primary Actions, "Hot" Leads, Accents |
| **Deep Earth (Secondary)**| `#4A403A` | Headings, Sidebar, Active States |
| **Sand Beige (Background)**| `#F5F2EB` | Main App Background (Paper-like feel) |
| **Warm White (Surface)** | `#FFFCF8` | Cards, Panels, Modals |
| **Stone Grey (Text - Body)**| `#5D5955` | Secondary Text, Meta info |
| **Charcoal (Text - Main)** | `#2D2A26` | Main Headings, High Contrast Text |
| **Sage Green (Success)** | `#4C7558` | Closed Won, Positive Trend, Safe |
| **Burnt Orange (Warning)** | `#D97742` | Warm Lead, Attention Needed |
| **Soft Outline** | `#E5E0D6` | Borders, Dividers |

### Typography
**Font Family**: `Outfit` (Headings) + `Inter` (Body/UI).
*   **Headings**: `Outfit` - Bold, Modern, Clean.
*   **UI Elements**: `Inter` - High legibility at small sizes.

### Visual Elements
*   **Shadows**: Soft, diffused shadows (`0px 4px 20px rgba(74, 64, 58, 0.08)`).
*   **Borders**: Thin, subtle borders (`1px solid #E5E0D6`).
*   **Radius**: Medium rounded (`8px` for buttons, `12px` for cards).
*   **Texture**: Subtle grain or noise on background (optional) to give a "paper" feel.

---

## 2. Layout Structure (Responsive)

### Desktop Layout (Grid System)
*   **Left Sidebar (Navigation)**: 64px (Collapsed) or 240px (Expanded). Icons + Labels.
*   **Main Content Area**: Flexible width. Contains the Dashboard/Kanban/List.
*   **Right Panel (Context/AI)**: 320px-400px fixed width. Toggleable. Shows Lead Details/AI Copilot.

### Mobile Layout (One-Handed Priority)
*   **Top Bar**: Branding + Global Search + Notifications.
*   **Main Content**: Vertical scrollable list/cards.
*   **Bottom Action Bar (Sticky)**: Floating Action Button (FAB) for AI Copilot + Main Nav Tabs.

---

## 3. Core Component Breakdown

### A. Lead Card (The "Atom" of the UI)
Used in Dashboard lists and Kanban board.
*   **Header**: Name (Bold) + Time ago (Right).
*   **Body**: 
    *   **Value Badge**: `₹ 2.5L` (Large, Bold, Clay Red).
    *   **Location**: Icon + City.
    *   **Status Tags**: [HOT], [Ghost Risk].
*   **Footer (Quick Actions)**:
    *   [Call] (Icon Only)
    *   [WhatsApp] (Icon Only)
    *   [Brief Status] ("Quote Sent 2d ago")

### B. Kanban Board (Pipeline)
*   **Columns**: New Lead -> Contacted -> Sample Sent -> Quote Sent -> Negotiation -> Closed.
*   **Header Stats**: Total Value per column (e.g., "Negotiation: ₹12L").
*   **Drag & Drop**: Smooth transitions.

### C. Top Performance Bar (The "Scoreboard")
*   **Location**: Top of Dashboard.
*   **Metrics**:
    *   **Target**: Progress Bar (Green fill on Beige track).
    *   **Today's Calls**: 5/10.
    *   **Pending Estimates**: 3.

### D. Floating AI Copilot ("Close Assist")
*   **Design**: Floating Action Button (FAB) - Bottom Right on Desktop, Center Bottom on Mobile.
*   **Icon**: Sparkles/Brain icon.
*   **Interaction**: Click expands a menu:
    *   "Draft Follow-up Message"
    *   "Suggest Products for [Lead Name]"
    *   "Calculate Quote Risk"

---

## 4. Interaction Flows

### Flow 1: Morning Blitz (Sales Rep Routine)
1.  **Dashboard Loads**: "Good Morning, Rahul. You have 5 HOT leads."
2.  **Top Section**: Shows "Today's Hit List" (5 cards).
3.  **User Actions**:
    *   Click [Call] on Lead 1 -> System logs call -> Opens Quick Note modal.
    *   Click [WhatsApp] on Lead 2 -> Opens Chat Panel -> AI drafts "Morning check-in".

### Flow 2: Quick Quote Generation
1.  **Trigger**: Click "Send Quote" on Lead Detail.
2.  **Product Selection**:
    *   Grid of product cards (Images + Price).
    *   Click to Add (+).
    *   Cart summary updates floating at bottom.
3.  **Review**: Edit Quantities -> See Margin %.
4.  **Send**: One-tap "Generate PDF & WhatsApp".

### Flow 3: Ghosting Rescue
1.  **Trigger**: Lead card turns "Grey" with "Ghosting Risk" badge.
2.  **AI Assistant**: Suggests "The 'Break-Up' Message" or "Value Drop" strategy.
3.  **Action**: Rep selects "Send Product Video" -> System sends video + "Thinking of you for this project".

---

## 5. Mobile-Specific UX
*   **Thumb Zone Navigation**: All primary actions (Call, Message, Next Status) within thumb reach.
*   **Swipe Actions**: Swipe Lead Card Right to Call, Left to Archive.
*   **Quick Note**: Long-press on any lead to dictate a voice note.

