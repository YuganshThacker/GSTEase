# GST Ease - Design Guidelines

## Design Approach

**System-Based Approach**: Drawing from modern productivity and financial management platforms (Linear, Stripe Dashboard, QuickBooks) with emphasis on data clarity, efficient workflows, and professional presentation. This is a utility-focused application where speed, accuracy, and information hierarchy are paramount.

## Core Design Principles

1. **Efficiency First**: Minimize clicks, maximize visibility of critical information
2. **Data Clarity**: Clear visual hierarchy for numbers, statuses, and actions
3. **Professional Presentation**: Trustworthy appearance suitable for business operations
4. **Workflow-Optimized**: Quick access to frequent tasks (billing, inventory checks)

## Typography

**Font Families**:
- Primary: Inter (UI, forms, data tables) - Google Fonts
- Secondary: JetBrains Mono (invoice numbers, amounts, GST calculations) - Google Fonts

**Hierarchy**:
- Page Titles: 2xl, semibold
- Section Headers: xl, semibold
- Data Labels: sm, medium, uppercase tracking
- Body/Forms: base, regular
- Table Data: sm, regular
- Numbers/Amounts: base or lg, medium (using JetBrains Mono)
- Small Labels/Meta: xs, medium

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: gap-6 or gap-8
- Form field spacing: space-y-4
- Card margins: m-6 or m-8

**Grid Structure**:
- Sidebar navigation: Fixed 64 width (w-64)
- Main content: Remaining space with max-w-7xl container
- Dashboard cards: 2-3 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Forms: Single column, max-w-2xl for optimal data entry

## Component Library

### Navigation
- **Sidebar**: Fixed left navigation with logo at top, grouped menu items (Dashboard, Billing, Inventory, Customers, Reports, Settings), active state highlighting
- **Top Bar**: Breadcrumbs, user profile, notifications icon, quick-add button

### Dashboard Cards
- **Metric Cards**: Display KPIs (Today's Sales, Stock Value, Pending Invoices, Tax Summary)
- **Chart Cards**: Revenue trends, top products, category breakdown
- **Quick Action Cards**: "Create Invoice", "Add Product", "Stock Alert" buttons
- Card structure: Title, primary metric (large), supporting detail, icon/visual indicator

### Data Tables
- Zebra striping for row differentiation
- Sticky headers for long lists
- Action column (right-aligned) with icon buttons
- Status badges (Paid/Pending/Overdue with distinct visual treatment)
- Sortable columns with clear indicators
- Search and filter bar above table
- Pagination controls below

### Forms
- Grouped sections with clear labels
- Inline validation feedback
- Required field indicators
- Auto-complete for customer/product selection
- Calculator-style number inputs for quantities/amounts
- GST breakdown display (CGST/SGST/IGST) as read-only calculated fields

### Invoice Display
- Professional layout with business header
- Clear item table with quantity, rate, tax columns
- Tax breakdown section
- Total amount prominently displayed
- Action buttons: Download PDF, Print, Send Email, Mark Paid

### Modals/Overlays
- Product quick-add modal
- Customer details popup
- Confirmation dialogs for destructive actions
- Low stock alerts as slide-over panel

### Status Indicators
- Stock levels: Green (healthy), Amber (low), Red (critical)
- Payment status: Green (paid), Blue (pending), Red (overdue)
- Invoice types: Distinct badges for B2B/B2C/Credit Note

### Buttons & Actions
- Primary: Create Invoice, Save, Generate Report
- Secondary: Cancel, Back, View Details
- Destructive: Delete, Void Invoice (with confirmation)
- Icon buttons for quick actions in tables

## Icons

**Library**: Heroicons (via CDN)
- Use outline style for navigation and secondary actions
- Use solid style for primary buttons and status indicators
- Common icons: DocumentText (invoices), CubeTransparent (inventory), Users (customers), ChartBar (reports), Cog (settings)

## Animations

Minimal, purposeful animations only:
- Sidebar collapse/expand transition
- Dropdown menu fade-in
- Success/error toast notifications slide-in
- No scroll animations or decorative effects

## Images

**No Hero Image Required** - This is a dashboard application focused on data and functionality.

**Image Usage**:
- Logo: Company/GST Ease branding in sidebar top (120x40px area)
- Empty States: Illustrations for "No invoices yet", "No products in inventory" (simple line drawings, 200x200px)
- User Avatar: Profile pictures in top bar (32x32px, circular)
- Product Thumbnails: Optional 48x48px squares in inventory lists

## Page-Specific Layouts

**Login Page**: Centered card (max-w-md), logo above, form fields, no distracting backgrounds

**Dashboard**: 3-column metric cards at top, followed by 2-column layout (left: recent invoices table, right: stock alerts + quick actions)

**Invoice Creation**: 2-column layout (left: form sections, right: live invoice preview with running total)

**Inventory List**: Full-width data table with filters sidebar (can collapse), bulk action toolbar when items selected

**Reports Page**: Date range selector at top, tabs for different report types, charts with data tables below

This design prioritizes speed, clarity, and professional presentation - essential for daily business operations involving financial transactions and inventory management.