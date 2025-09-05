"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar({ user, handleLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const mobileRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navItems = [
  { href: "/", label: "Home", auth: false },
  { href: "/markets", label: "Markets", auth: false }, // 👈 NEW
  { href: "/watchlist", label: "Watchlist", auth: true },
  { href: "/portfolio", label: "Portfolio", auth: true },
  { href: "/profile", label: "Profile", auth: true },
];


  // Use pathname only after mount
  const pathnameSafe = mounted ? pathname : "";
  const userSafe = mounted ? user : null;

  const isActive = useMemo(
    () => (href) => {
      if (!mounted) return false;
      if (href === "/") return pathnameSafe === "/";
      return pathnameSafe.startsWith(href);
    },
    [mounted, pathnameSafe]
  );

  const activeColor = (href) =>
    isActive(href) ? "text-primary-500" : "text-foreground/80";

  const headerScrolled = mounted && isScrolled;

  return (
    <header
      suppressHydrationWarning
      className={`fixed inset-x-0 top-0 z-50 h-16 md:h-20 w-full border-b transition-all
        ${headerScrolled
          ? "backdrop-blur-md bg-background/70 border-foreground/10"
          : "bg-background/40 backdrop-blur-[2px] border-transparent"
        }`}
      role="banner"
    >
      {/* iOS safe-area */}
      <div className="h-0" style={{ paddingTop: "env(safe-area-inset-top)" }} />

      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] rounded-md bg-black/80 px-3 py-2 text-sm text-white"
      >
        Skip to content
      </a>

      <nav
        className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Image
              src="/logo.png"
              alt="BAWSAQ logo"
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
              priority
            />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary-500">
              FinSights
            </span>
            <span className="text-[11px] uppercase tracking-widest text-foreground/60">
              Markets Dashboard
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems
            .filter((i) => !i.auth || !!userSafe)
            .map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:text-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/40 ${mounted ? activeColor(item.href) : "text-foreground/80"}`}
                >
                  {item.label}
                  {/* Render underline only after mount to avoid SSR/CSR diff */}
                  {mounted && (
                    <span
                      className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform ${active ? "scale-x-100 bg-primary-500" : "scale-x-0 bg-transparent"}`}
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
        </div>

        {/* Right side: auth */}
        <div className="hidden items-center gap-2 md:flex">
          {userSafe ? (
            <UserMenu user={userSafe} onLogout={handleLogout} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium ring-1 ring-foreground/15 transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Signup
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-foreground/15 md:hidden focus-visible:ring-2 focus-visible:ring-primary-500 transition ${open ? "bg-foreground/10" : "bg-transparent"}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Hamburger open={open} />
        </button>
      </nav>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 transition ${open ? "opacity-100" : "pointer-events-none opacity-0"} md:hidden`}
        onClick={() => setOpen(false)}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Mobile sheet */}
      <div className={`md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          id="mobile-menu"
          ref={mobileRef}
          className={`relative z-50 mx-3 mb-3 rounded-2xl border border-foreground/10 bg-background/95 p-2 shadow-lg backdrop-blur transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex flex-col gap-1 p-1">
            {navItems
              .filter((i) => !i.auth || !!userSafe)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary-500 ${mounted ? activeColor(item.href) : "text-foreground/80"}`}
                >
                  {item.label}
                </Link>
              ))}
          </div>

          <div className="my-2 h-px w-full bg-foreground/10" />

          {userSafe ? (
            <div className="flex items-center justify-between gap-3 px-2 pb-2">
              <UserChip user={userSafe} />
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 px-2 pb-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-center text-sm font-medium ring-1 ring-foreground/15 hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Hamburger({ open }) {
  const bar = `absolute left-1/2 -translate-x-1/2 h-0.5 w-6 rounded transition-transform`;
  const color = open
    ? "bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]"
    : "bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.35)]";

  return (
    <div className="relative h-4 w-6" aria-hidden>
      <span className={`${bar} ${color} ${open ? "translate-y-2 rotate-45" : "translate-y-0 rotate-0"}`} />
      <span className={`${bar} ${color} ${open ? "opacity-0" : "opacity-100"} translate-y-2`} />
      <span className={`${bar} ${color} ${open ? "translate-y-2 -rotate-45" : "translate-y-4 rotate-0"}`} />
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-3 rounded-xl px-2 py-1.5 ring-1 ring-foreground/10 hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserChip user={user} />
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-xl"
        >
          <div className="px-3 py-2 text-xs text-foreground/60">Account</div>
          <div className="px-2 pb-2">
            <Link
              href="/profile"
              className="block rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary-500"
              role="menuitem"
            >
              Profile
            </Link>
            <button
              onClick={onLogout}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserChip({ user }) {
  const email = user?.email || "User";
  const name = email.split("@")[0];
  const initials =
    name
      .split(/[._-]/)
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-foreground/10 ring-1 ring-foreground/10">
        {user?.photoURL ? (
          <Image src={user.photoURL} alt={name} width={32} height={32} className="h-8 w-8 object-cover" />
        ) : (
          <span className="text-xs font-semibold text-foreground/80">{initials}</span>
        )}
      </span>
      <span className="max-w-[12ch] truncate text-sm font-medium text-foreground/90">{email}</span>
    </div>
  );
}

/**
 * SSR is now deterministic:
 * - No pathname/user-dependent UI until mounted
 * - No underline element on SSR
 * - Scroll styles apply after mount
 */
