import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{target:'es2022',modulePreload:false,assetsInlineLimit:Infinity},server:{host:'127.0.0.1'}});
