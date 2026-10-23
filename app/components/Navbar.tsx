"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Brand from "@/components/Brand";
import Icon from "@/components/Icon";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const inTournaments =
    pathname === "/dashboard" ||
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/games");
  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">
        Vai al contenuto
      </a>
      <div className="nav-inner">
        <Brand href={session ? "/dashboard" : "/"} />
        <nav className="main-nav" aria-label="Navigazione principale">
          {session ? (
            <Link
              href="/dashboard"
              className={inTournaments ? "nav-link active" : "nav-link"}
              aria-current={inTournaments ? "page" : undefined}
            >
              <Icon name="trophy" size={18} />I miei tornei
            </Link>
          ) : (
            <Link href="/#come-funziona" className="nav-link how-link">
              Come funziona
            </Link>
          )}
          <Link
            href="/balancer"
            className={
              pathname === "/balancer" ? "nav-link active" : "nav-link"
            }
            aria-current={pathname === "/balancer" ? "page" : undefined}
          >
            <Icon name="pitch" size={18} />
            Crea squadre
          </Link>
        </nav>
        <div className="nav-account">
          {session ? (
            <details className="account-menu">
              <summary aria-label="Menu del tuo account">
                <span className="account-avatar">
                  {session.user?.name?.substring(0, 2).toUpperCase() || "SI"}
                </span>
                <span className="account-name">
                  {session.user?.name?.split(" ")[0]}
                </span>
                <Icon name="down" size={15} />
              </summary>
              <div className="account-dropdown">
                <p>
                  {session.user?.name}
                  <span>{session.user?.email}</span>
                </p>
                <Link href="/profile">
                  <Icon name="users" size={17} />
                  Il mio profilo
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })}>
                  <Icon name="logout" size={17} />
                  Esci dall’account
                </button>
              </div>
            </details>
          ) : status === "loading" ? (
            <span
              className="account-placeholder"
              aria-label="Caricamento account"
            />
          ) : (
            <>
              <Link href="/login" className="nav-signin">
                Accedi
              </Link>
              <Link href="/register" className="btn btn-primary nav-register">
                Inizia gratis
                <Icon name="arrow" size={17} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
