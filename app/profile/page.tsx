"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Image from "next/image";

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [profileImage, setProfileImage] = useState<string>("");
    const [newImage, setNewImage] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.image) {
            setProfileImage(session.user.image);
        }
    }, [session]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!newImage) {
            setMessage("Seleziona un'immagine prima di caricare.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: newImage,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Immagine del profilo aggiornata con successo!");
                setProfileImage(data.image);
                setNewImage("");
                setImageFile(null);

                // Update session with new image
                await update({ image: data.image });

                // Wait a bit for the message to show
                setTimeout(() => {
                    setMessage("");
                }, 3000);
            } else {
                setMessage(data.error || "Errore durante l'aggiornamento dell'immagine.");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setMessage("Errore durante l'upload dell'immagine.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="container mx-auto p-6 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Il Tuo Profilo</h1>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex flex-col items-center gap-6">
                            {/* Current Profile Image */}
                            <div className="avatar">
                                <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <img
                                        src={newImage || profileImage || `https://ui-avatars.com/api/?name=${session.user?.name}`}
                                        alt="Profile"
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold">{session.user?.name}</h2>
                                <p className="text-base-content/70">{session.user?.email}</p>
                            </div>

                            <div className="divider">Aggiorna Immagine Profilo</div>

                            {/* Image Upload Section */}
                            <div className="w-full space-y-4">
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text">Seleziona nuova immagine</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="file-input file-input-bordered w-full"
                                    />
                                </div>

                                {message && (
                                    <div className={`alert ${message.includes("successo") ? "alert-success" : "alert-error"}`}>
                                        <span>{message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={!newImage || loading}
                                    className="btn btn-primary w-full"
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Caricamento...
                                        </>
                                    ) : (
                                        "Salva Immagine"
                                    )}
                                </button>

                                {newImage && (
                                    <button
                                        onClick={() => {
                                            setNewImage("");
                                            setImageFile(null);
                                        }}
                                        className="btn btn-ghost w-full"
                                    >
                                        Annulla
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
