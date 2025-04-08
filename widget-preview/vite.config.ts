import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()], build: {
        /*terserOptions: {
            compress: false, mangle: false
        }, minify: false,*/
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    }, resolve: {
        alias: {
            vue: "vue/dist/vue.esm-bundler.js"
        }
    }
});
