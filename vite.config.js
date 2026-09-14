import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
// base: './' → 정적 호스팅 대응
// viteSingleFile → 모든 JS/CSS를 index.html 하나에 인라인하여
// 파일을 더블클릭(file://)으로 바로 열 수 있게 함.
export default defineConfig({
    base: './',
    plugins: [react(), viteSingleFile()],
});
