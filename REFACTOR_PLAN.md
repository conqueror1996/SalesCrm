# Refactoring Plan - Urban Clay CRM

## Phase 1: Foundation & Styling
1.  **Install Dependencies**: `lucide-react` (for icons), `clsx`, `tailwind-merge` (if using Tailwind, but user said Vanilla CSS - we will stick to CSS Modules but clean up variables).
2.  **Global CSS Update**:
    *   Update `globals.css` (or equivalent) with the new Color Palette variables.
    *   Reset browser defaults.
    *   Import Google Fonts (Outfit & Inter).
3.  **Layout Component**:
    *   Create `src/components/layout/Shell.tsx` to handle the responsive Sidebar + Main Content structure.

## Phase 2: Component Extraction
Break down `page.tsx` into:
1.  `src/components/dashboard/StatsBar.tsx`
2.  `src/components/leads/LeadCard.tsx`
3.  `src/components/leads/LeadList.tsx`
4.  `src/components/pipeline/KanbanBoard.tsx` (New Feature)
5.  `src/components/chat/ChatPanel.tsx`
6.  `src/components/catalog/ProductGrid.tsx`

## Phase 3: New Features
1.  **Kanban View**: Implement Drag & Drop logic (using `dnd-kit` or simple HTML5 API if keeping it light).
2.  **Mobile Navigation**: Implement the Bottom Sticky Bar for mobile view.
3.  **AI Copilot**: Create the Floating Action Button and its menu.

## Phase 4: Integration
1.  Reassemble `src/app/page.tsx` to use the new components.
2.  Ensure State Management (Context or just specialized hooks) covers the data flow between components.
