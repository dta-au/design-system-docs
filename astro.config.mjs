import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import remarkDeflist from 'remark-deflist';

import { remarkPrefixAbsoluteLinks } from './src/remark/prefix-absolute-links.mjs';

// On GitHub Actions the site is served from <org>.github.io/<repo>/, so we
// need a base path. Locally and on Surge it's served at the root.
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubActions ? '/design-system-docs/' : '/';

export default defineConfig({
  site: isGitHubActions
    ? 'https://dta-au.github.io'
    : 'https://publisher-digital-govau.surge.sh',
  base,
  trailingSlash: 'always',

  build: {
    format: 'directory',
  },

  markdown: {
    remarkPlugins: [[remarkPrefixAbsoluteLinks, { base }], remarkDeflist],
  },

  integrations: [mdx()],
});
