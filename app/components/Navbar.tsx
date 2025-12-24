"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <div className="navbar bg-base-100 shadow-lg px-4">
            <div className="flex-1">
                <Link href="/dashboard" className="btn btn-ghost text-xl normal-case">
                    Squadra Ideale
                </Link>
            </div>
            <div className="flex-none gap-4">
                {session ? (
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full">
                                <img src={session.user?.image || "https://ui-avatars.com/api/?name=" + session.user?.name} alt="avatar" />
                            </div>
                        </label>
                        <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                            <li>
                                <a className="justify-between">
                                    {session.user?.name}
                                </a>
                            </li>
                            <li><Link href="/profile">Profilo</Link></li>
                            <li><button onClick={() => signOut({ callbackUrl: "/login" })}>Esci</button></li>
                        </ul>
                    </div>
                ) : (
                    <Link href="/login" className="btn btn-primary">
                        Accedi
                    </Link>
                )}
            </div>
        </div>
    );
}
