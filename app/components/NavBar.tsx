"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/transactions/new", label: "记一笔" },
  { href: "/transactions", label: "明细" },
  { href: "/export", label: "导出" },
];

export function NavBar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  if (!session || pathname === "/login") return null;

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-gray-200 bg-white">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 py-3 text-center text-sm ${
              active ? "font-semibold text-blue-600" : "text-gray-600"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="flex-1 py-3 text-center text-sm text-gray-600"
      >
        退出
      </button>
    </nav>
  );
}
