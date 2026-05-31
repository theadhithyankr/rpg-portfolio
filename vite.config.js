import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const key = env.GROQ_API_KEY;
  return {
    server: {
      proxy: key
        ? {
            '/api/groq': {
              target: 'https://api.groq.com',
              changeOrigin: true,
              rewrite: () => '/openai/v1/chat/completions',
              headers: { Authorization: `Bearer ${key}` },
            },
          }
        : {},
    },
  };
});
