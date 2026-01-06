export default function StructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Squadra Ideale",
        "description": "Piattaforma per organizzare tornei sportivi, bilanciare squadre e tracciare statistiche",
        "url": "https://squadra-ideale.vercel.app",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR"
        },
        "featureList": [
            "Organizzazione tornei sportivi",
            "Bilanciamento automatico squadre",
            "Tracciamento statistiche giocatori",
            "Gestione partite e risultati",
            "Classifiche in tempo reale"
        ],
        "inLanguage": "it-IT",
        "potentialAction": {
            "@type": "UseAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://squadra-ideale.vercel.app/register"
            }
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
