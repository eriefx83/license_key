import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/actions";

type PortalShellProps = {
  activePage: "dashboard" | "licenses" | "users";
  children: ReactNode;
  title: string;
  user: {
    email: string;
    name: string;
    role: string;
  };
};

export function PortalShell({
  activePage,
  children,
  title,
  user,
}: PortalShellProps) {
  return (
    <main className="portal-shell">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark brand-mark-small" aria-hidden="true">
            LK
          </span>
          <div>
            <strong>License Key</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          <Link
            className={`sidebar-link ${
              activePage === "dashboard" ? "sidebar-link-active" : ""
            }`}
            href="/dashboard"
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              D
            </span>
            Dashboard
          </Link>

          {user.role === "admin" && (
            <>
              <Link
                className={`sidebar-link ${
                  activePage === "licenses" ? "sidebar-link-active" : ""
                }`}
                href="/admin/licenses/generate"
              >
                <span className="sidebar-link-icon" aria-hidden="true">
                  L
                </span>
                Generate License
              </Link>

              <Link
                className={`sidebar-link ${
                  activePage === "users" ? "sidebar-link-active" : ""
                }`}
                href="/admin/users"
              >
                <span className="sidebar-link-icon" aria-hidden="true">
                  U
                </span>
                Users
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-account">
          <div className="sidebar-user">
            <span className="user-avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <form action={logout}>
            <button className="sidebar-logout" type="submit">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-header">
          <div>
            <p className="eyebrow">Testing Portal</p>
            <h1>{title}</h1>
          </div>
          <span className="header-role">{user.role}</span>
        </header>

        <div className="portal-content">{children}</div>
      </section>
    </main>
  );
}
