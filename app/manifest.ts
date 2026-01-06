import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Squadra Ideale - Gestione Tornei Sportivi',
        short_name: 'Squadra Ideale',
        description: 'Organizza tornei sportivi, bilancia squadre e traccia statistiche',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#570df8',
        icons: [
            {
                src: '/calcio_vert.jpeg',
                sizes: 'any',
                type: 'image/jpeg',
            },
        ],
    };
}
