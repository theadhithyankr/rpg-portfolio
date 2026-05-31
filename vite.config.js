import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

function copyUnbundledAssets() {
  return {
    name: 'copy-unbundled-assets',
    closeBundle() {
      const srcDir = process.cwd();
      const destDir = resolve(srcDir, 'dist');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
      
      const exts = ['.js', '.jsx'];
      fs.readdirSync(srcDir).forEach(file => {
        if (exts.some(ext => file.endsWith(ext)) && file !== 'vite.config.js') {
          fs.copyFileSync(resolve(srcDir, file), resolve(destDir, file));
        }
      });
      // Also copy directories if they exist
      ['screenshots', 'uploads'].forEach(dir => {
        const fullSrc = resolve(srcDir, dir);
        const fullDest = resolve(destDir, dir);
        if (fs.existsSync(fullSrc) && fs.statSync(fullSrc).isDirectory()) {
          if (!fs.existsSync(fullDest)) fs.mkdirSync(fullDest, { recursive: true });
          fs.readdirSync(fullSrc).forEach(file => {
            fs.copyFileSync(resolve(fullSrc, file), resolve(fullDest, file));
          });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const key = env.GROQ_API_KEY;
  return {
    plugins: [copyUnbundledAssets()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          world: resolve(__dirname, 'world.html')
        }
      }
    },
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
