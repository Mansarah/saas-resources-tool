// nav-config.ts
export const adminNav = [
  { title: "Dashboard", url: "/admin", icon: "layout-dashboard" },
  { title: "Calendar", url: "/admin/admin-calender", icon: "calendar" },
  { title: "Time Off Requests", url: "/admin/time-off-requests", icon: "clock" },
  {
    title: "Company Settings",
    url: "#",
    icon: "settings",
    items: [
      { title: "Profile", url: "/admin/company-settings/profile", icon: "building-2" },
      { title: "Holidays", url: "/admin/company-settings/holidays", icon: "sun" },
      { title: "Working Days", url: "/admin/company-settings/working-days", icon: "calendar-days" },
    ],
  },
  {
    title: "Team Management",
    url: "#",
    icon: "users",
    items: [
      { title: "Employees", url: "/admin/team-management/employees", icon: "user-round" },
      { title: "Invitation Codes", url: "/admin/team-management/invitation-codes", icon: "key-round" },
    ],
  },
  { title: "Report", url: "/admin/report", icon: "bar-chart-3" },
  // { title: "Upgrade", url: "/admin/upgrade", icon: "bar-chart-3" },
  // { title: "Integration", url: "/admin/integration", icon: "puzzle" },
  { title: "Subscription", url: "/admin/subscription", icon: "puzzle" },
  { title: "Chat", url: "/admin/chat", icon: "puzzle" },
]

export const employeeNav = [
  { title: "Dashboard", url: "/employee", icon: "layout-dashboard" },
  { title: "Calendar", url: "/employee/calender", icon: "calendar" },
  { title: "New Requests", url: "/employee/new-request", icon: "file-plus" },
  { title: "Requests List", url: "/employee/all-request", icon: "list" },
  { title: "Chat", url: "/employee/chat", icon: "list" },
]
