import { Bell, Menu, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnvConfig } from "@/utils/config/envConfig";
import { getTimeBasedGreeting } from "@/utils/helper/dashboard.helper";

function DashboardNavbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-18 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-6 xl:px-8 w-full">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Open navigation"
          className="xl:hidden"
          onClick={onOpenSidebar}
          size="icon"
          type="button"
          variant="ghost">
          <Menu aria-hidden="true" />
        </Button>
        <div>
          <p className="text-xs font-medium text-slate-500">Welcome back</p>
          <h1 className="text-lg font-semibold">
            {getTimeBasedGreeting()}, {EnvConfig.OWNER_NAME}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button aria-label="Notifications" size="icon" title="Notifications" type="button" variant="ghost">
          <Bell aria-hidden="true" />
        </Button>
        <div className="hidden h-9 w-px bg-slate-200 sm:block" />
        <button
          aria-label="Open admin profile"
          className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-slate-100"
          type="button">
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-white">
            <UserRound aria-hidden="true" className="size-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-4">{EnvConfig.OWNER_NAME}</p>
            <p className="mt-1 text-xs text-slate-500">Owner access</p>
          </div>
        </button>
      </div>
    </header>
  );
}

export default DashboardNavbar;
