"use client";

import { useState } from "react";
import { Ticket, RotateCcw, Mail } from "lucide-react";
import PlataformasTab from "./_components/PlataformasTab";
import CanjesTab from "./_components/CanjesTab";
import EmailConfigTab from "./_components/EmailConfigTab";

const TABS = [
  { key: "plataformas", label: "Plataformas", icon: Ticket },
  { key: "canjes", label: "Canjes", icon: RotateCcw },
  { key: "email", label: "Configuración Email", icon: Mail },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function TicketingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("plataformas");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D2A26]">
          Ticketing
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-[#E8E4DE]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#E87B5A] text-[#E87B5A]"
                  : "border-transparent text-[#8A8580] hover:text-[#2D2A26] hover:border-[#E8E4DE]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "plataformas" && <PlataformasTab />}
      {activeTab === "canjes" && <CanjesTab />}
      {activeTab === "email" && <EmailConfigTab />}
    </div>
  );
}
