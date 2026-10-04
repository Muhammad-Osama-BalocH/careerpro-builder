import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerproof.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/career/', '/builder/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
