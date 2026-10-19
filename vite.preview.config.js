// Bản dựng một file duy nhất để xem thử (không dùng cho Vercel)
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-preview',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
