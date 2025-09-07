import Page from "../dashboard-layout/page";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 

  return (
    <div className="min-h-screen flex-col">
     
      
        <main >
          
          <Page>
          {children}
          </Page>
          
          </main>
    
    </div>
  );
}
