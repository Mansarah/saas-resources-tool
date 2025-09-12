// app/(dashboard)/layout.tsx
import Page from "../dashboard-layout/page";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminNav, employeeNav } from "@/lib/nav-config";


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <div>Please sign in</div>;
  }

  const role = session.user.role; 

  const navMain = role === "ADMIN" ? adminNav : employeeNav;
const user = {
    name: session.user.name ?? `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim(),
    role: session.user.role,
    image: session.user.image ?? null,
    companyName: session.user.companyName ?? null,
  };
  return (
    <div className="min-h-screen flex-col">
      <main>
        <Page navMain={navMain} user={user}>{children}</Page>
      </main>
    </div>
  );
}
