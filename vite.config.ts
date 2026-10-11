import { defineConfig } from 'vite';

export default defineConfig({
  // `tsc` do build emite para `dist/` antes do `vite build` limpar a pasta. Um
  // build interrompido (erro de tipo) deixa `dist/__tests__/*.test.js` para
  // trás, e o vitest os coletava como se fossem fonte: a suíte passava de 45
  // arquivos para 77 e 50 testes quebravam por caminho relativo errado.
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'dist/**'],
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    // Caminhos relativos: o build precisa abrir de um subpath e dentro de um
    // iframe. No itch.io o HTML5 roda em `itch.io/html/<id>/`, e com o padrão
    // (`/assets/...`) todo sprite, som e música daria 404.
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  base: './',
});
