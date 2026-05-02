"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex h-14 items-center gap-4 px-6" style={{background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderBottom: '0.5px solid rgba(255,255,255,0.75)'}}>
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg p-1 pr-2.5 transition-colors hover:bg-slate-50">
            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-[#4F8EF7] to-[#6BA0F9] text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-[13px] font-semibold leading-none text-slate-900">
                {user?.name ?? "Usuario"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {user?.roleName ?? ""}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
            <DropdownMenuItem className="gap-2 rounded-lg">
              <User className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 rounded-lg text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
