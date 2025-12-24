'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }

        try {
            const resUserExists = await fetch("api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const { message } = await resUserExists.json();

            if (resUserExists.ok) {
                const form = e.target as HTMLFormElement;
                form.reset();
                setError("");
                setSuccess(true);
                // Automatically redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(message);
            }
        } catch (error) {
            setError("Si è verificato un errore durante la registrazione.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
            <div className="card w-full max-w-sm shadow-2xl bg-base-100">
                <div className="card-body">
                    <h2 className="card-title justify-center text-2xl font-bold mb-4">Registrati</h2>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Nome Completo</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Mario Rossi"
                                className="input input-bordered"
                                required
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="input input-bordered"
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="********"
                                className="input input-bordered"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error text-sm py-2">
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success text-sm py-3">
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="font-bold">Registrazione completata con successo!</div>
                                        <div className="text-xs mt-1">
                                            Il tuo account è stato creato. Ora puoi{" "}
                                            <Link href="/login" className="link link-hover underline font-semibold">
                                                accedere qui
                                            </Link>{" "}
                                            con le tue credenziali.
                                        </div>
                                        <div className="text-xs mt-1 opacity-70">
                                            Sarai reindirizzato automaticamente tra pochi secondi...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary" disabled={success}>
                                Registrati
                            </button>
                        </div>
                    </form>

                    <div className="divider">OPPURE</div>

                    <button
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className="btn btn-outline"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" className="mr-2">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Registrati con Google
                    </button>

                    <p className="text-center mt-4 text-sm">
                        Hai già un account?{" "}
                        <Link href="/login" className="link link-primary">
                            Accedi
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
