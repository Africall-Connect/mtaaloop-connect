import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CSRSidebar } from "./CSRSidebar";
import { CSRTopBar } from "./CSRTopBar";

export function CSRLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-64 md:shrink-0 md:fixed md:inset-y-0 md:left-0">
        <CSRSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-slate-800">
          <CSRSidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <CSRTopBar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
