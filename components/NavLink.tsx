"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

export default function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-3 rounded-[6px] transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-600"
          : "text-[#636363] hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

