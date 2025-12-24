import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
        }

        return NextResponse.json({
            name: user.name,
            email: user.email,
            image: user.image,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Errore del server" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
        }

        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json({ error: "Immagine richiesta" }, { status: 400 });
        }

        // Validate base64 image
        if (!image.startsWith("data:image/")) {
            return NextResponse.json({ error: "Formato immagine non valido" }, { status: 400 });
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "squadra_ideale/profile_images",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto" },
            ],
        });

        // Get the Cloudinary URL
        const imageUrl = uploadResponse.secure_url;

        await dbConnect();
        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { image: imageUrl },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Immagine del profilo aggiornata con successo",
            image: user.image,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Errore del server" }, { status: 500 });
    }
}
