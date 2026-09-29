import {build} from 'esbuild';
await build({entryPoints:['node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'],bundle:true,format:'esm',minify:true,outfile:'.test-output/map-worker.txt'});
