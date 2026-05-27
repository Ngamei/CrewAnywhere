import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CrewAnywhere',
    short_name: 'CrewAnywhere',
    description: 'Event workforce operations platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#020617',
  };
}
