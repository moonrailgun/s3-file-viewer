import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'S3 File Viewer',
  description:
    'A modern desktop application for browsing and managing S3-compatible object storage',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/favicon.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Configuration Guide', link: '/configuration-guide' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [{ text: 'Configuration Guide', link: '/configuration-guide' }],
      },
      {
        text: 'Cloud Providers',
        collapsed: false,
        items: [
          { text: 'AWS S3', link: '/providers/aws-s3' },
          { text: 'Cloudflare R2', link: '/providers/cloudflare-r2' },
          { text: 'MinIO', link: '/providers/minio' },
          { text: 'Alibaba Cloud OSS', link: '/providers/aliyun-oss' },
          { text: 'Tencent Cloud COS', link: '/providers/tencent-cos' },
          { text: 'Backblaze B2', link: '/providers/backblaze-b2' },
          {
            text: 'DigitalOcean Spaces',
            link: '/providers/digitalocean-spaces',
          },
        ],
      },
      {
        text: 'Other Services',
        collapsed: true,
        items: [
          {
            text: 'S3-Compatible Services',
            link: '/providers/other-s3-compatible',
          },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/moonrailgun/s3-file-viewer' },
    ],
  },
});
