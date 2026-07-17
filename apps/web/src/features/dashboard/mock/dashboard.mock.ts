import {
  Users,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Plus,
  Settings,
  Activity,
  Clock,
  Building2,
  Target,
  Megaphone,
  BookMarked,
  Contact,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const platformStats = [
  {
    name: 'Total Institutes',
    value: '42',
    change: '+3 this month',
    icon: Building2,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    href: '/dashboard/institutes',
  },
  {
    name: 'Active Institutes',
    value: '38',
    change: '90% active rate',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    href: '/dashboard/institutes?status=active',
  },
  {
    name: 'Suspended Institutes',
    value: '4',
    change: 'Action required',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    href: '/dashboard/institutes?status=suspended',
  },
  {
    name: 'Monthly Revenue',
    value: '₹12.8L',
    change: '+15% vs last month',
    icon: DollarSign,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    href: '/dashboard/subscriptions',
  },
];

export const platformQuickActions = [
  {
    name: 'Create Tenant',
    description: 'Onboard new institute',
    icon: Plus,
    href: '/dashboard/institutes/new',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    name: 'Subscriptions',
    description: 'Manage plans & tiers',
    icon: DollarSign,
    href: '/dashboard/subscriptions',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    name: 'Global Settings',
    description: 'System configuration',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    name: 'System Health',
    description: 'Monitor server resources',
    icon: Activity,
    href: '/dashboard/health',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

export const platformRecentActivity = [
  {
    id: 1,
    action: 'New institute onboarded',
    details: 'Apex NEET Academy registered successfully',
    time: '3 hours ago',
    type: 'success',
    icon: CheckCircle,
  },
  {
    id: 2,
    action: 'Subscription upgraded',
    details: 'Alpha Coaching Center upgraded to Premium Plan',
    time: '5 hours ago',
    type: 'success',
    icon: DollarSign,
  },
  {
    id: 3,
    action: 'Tenant account suspended',
    details: 'Sigma Coaching suspended due to unpaid invoices',
    time: '1 day ago',
    type: 'warning',
    icon: AlertTriangle,
  },
  {
    id: 4,
    action: 'New admin created',
    details: 'Created Admin User for Zenith Institute',
    time: '1 day ago',
    type: 'info',
    icon: Users,
  },
  {
    id: 5,
    action: 'Subscription expiring soon',
    details: 'Beta NEET Center subscription expires in 3 days',
    time: '2 days ago',
    type: 'warning',
    icon: Clock,
  },
];

export const platformFeatures = [
  {
    name: 'Tenant Provisioning',
    description: 'Create and deploy new client databases',
    icon: Building2,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    href: '/dashboard/institutes/new',
  },
  {
    name: 'Subscription Pricing',
    description: 'Configure pricing plans & billing metrics',
    icon: DollarSign,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    href: '/dashboard/subscriptions',
  },
  {
    name: 'System Health Status',
    description: 'Monitor server resources & usage quotas',
    icon: Activity,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    href: '/dashboard/health',
  },
];

export const tenantStats = [
  {
    name: 'Students',
    value: '1,248',
    change: '+12 Today',
    icon: Users,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    href: '/dashboard/students',
  },
  {
    name: 'Active Batches',
    value: '24',
    change: 'Full operational status',
    icon: Building2,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    href: '/dashboard/batches',
  },
  {
    name: 'Mock Tests',
    value: '18',
    change: 'Upcoming tests scheduled',
    icon: Target,
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
    href: '/dashboard/mock-tests',
  },
  {
    name: 'Fee Collection',
    value: '₹4.8L',
    change: 'This Month',
    icon: DollarSign,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    href: '/dashboard/fees',
  },
];

export const tenantQuickActions = [
  {
    name: 'New Admission',
    icon: Contact,
    href: '/dashboard/admissions/new',
    color: 'bg-purple-50 text-[#7C3AED]',
  },
  {
    name: 'Add Student',
    icon: Plus,
    href: '/dashboard/students/new',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'Create Batch',
    icon: Building2,
    href: '/dashboard/batches/new',
    color: 'bg-green-50 text-green-600',
  },
  {
    name: 'Schedule Test',
    icon: Target,
    href: '/dashboard/mock-tests/new',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    name: 'Upload Material',
    icon: BookMarked,
    href: '/dashboard/study-materials/new',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    name: 'Send Announce',
    icon: Megaphone,
    href: '/dashboard/announcements/new',
    color: 'bg-rose-50 text-rose-600',
  },
];

export const todayClasses = [
  {
    time: '9:00 AM',
    subject: 'Biology',
    topic: 'Cell Division - Mitosis',
    color: 'bg-purple-50 text-[#7C3AED] border-purple-100',
  },
  {
    time: '10:30 AM',
    subject: 'Physics',
    topic: 'Electromagnetism Basics',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    time: '2:00 PM',
    subject: 'Chemistry',
    topic: 'Organic Reaction Pathways',
    color: 'bg-green-50 text-green-600 border-green-100',
  },
  {
    time: '5:00 PM',
    subject: 'Doubt Session',
    topic: 'Weekly Mock Test Review',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
  },
];

export const recentAdmissions = [
  {
    name: 'Arjun Sharma',
    course: 'NEET Premium',
    batch: 'Batch A',
    status: 'ACTIVE',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'Priya Patel',
    course: 'NEET Foundation',
    batch: 'Batch C',
    status: 'ACTIVE',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'Rahul Kumar',
    course: 'NEET Repeater',
    batch: 'Batch B',
    status: 'PENDING',
    statusColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Srinivas Murthy',
    course: 'NEET Premium',
    batch: 'Batch A',
    status: 'ACTIVE',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'Anjali Gupta',
    course: 'NEET Foundation',
    batch: 'Batch D',
    status: 'PENDING',
    statusColor: 'bg-amber-100 text-amber-700',
  },
];

export const feeSummary = {
  collected: {
    label: 'Collected (₹4,82,000)',
    percentage: 82,
    color: 'bg-[#7C3AED]',
    textClass: 'text-[#7C3AED]',
  },
  pending: {
    label: 'Pending (₹78,000)',
    percentage: 18,
    color: 'bg-[#F59E0B]',
    textClass: 'text-[#F59E0B]',
  },
  overdue: {
    label: 'Overdue (₹21,000)',
    percentage: 6,
    color: 'bg-[#EF4444]',
    textClass: 'text-[#EF4444]',
  },
};

export const upcomingMockTests = [
  { title: 'NEET Grand Test 12', time: 'Tomorrow', desc: '420 Students Registered' },
  { title: 'Physics Revision Test', time: 'Friday', desc: 'Syllabus: Optics & Mechanics' },
  { title: 'Biology Chapter Practice', time: 'Sunday', desc: 'Focus: Genetics' },
];

export const aiInsights = [
  {
    text: '18 students at risk of performance drop',
    type: 'danger',
    icon: AlertCircle,
    color: 'text-[#EF4444] bg-red-50 border-red-100',
  },
  {
    text: 'Physics scores increased +6% in Batch A',
    type: 'success',
    icon: TrendingUp,
    color: 'text-[#22C55E] bg-green-50 border-green-100',
  },
  {
    text: 'Biology attendance dropped 4% overall',
    type: 'warning',
    icon: AlertTriangle,
    color: 'text-[#F59E0B] bg-amber-50 border-amber-100',
  },
  {
    text: '9 toppers show consistent improvements',
    type: 'success',
    icon: CheckCircle,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
];

export const parentMessages = [
  { label: 'SMS Sent', count: '120', color: 'bg-purple-50 text-[#7C3AED]' },
  { label: 'WhatsApp Pending', count: '86', color: 'bg-amber-50 text-[#F59E0B]' },
  { label: 'Emails Sent', count: '45', color: 'bg-blue-50 text-blue-600' },
  { label: 'Unread Replies', count: '4', color: 'bg-red-50 text-[#EF4444]' },
];

export const pendingTasks = [
  { name: 'Admissions', count: '12', url: '/dashboard/admissions?status=pending' },
  { name: 'Fee Followups', count: '18', url: '/dashboard/billing?status=followup' },
  { name: 'Doubt Tickets', count: '7', url: '/dashboard/doubts' },
  { name: 'Docs Pending', count: '5', url: '/dashboard/documents?status=missing' },
];

export const performanceOverview = [
  { label: 'Average Score', percentage: 78, color: 'bg-[#7C3AED]', textClass: 'text-[#7C3AED]' },
  { label: 'Attendance', percentage: 91, color: 'bg-[#22C55E]', textClass: 'text-[#22C55E]' },
  {
    label: 'Syllabus Completion',
    percentage: 84,
    color: 'bg-blue-600',
    textClass: 'text-blue-600',
  },
];
