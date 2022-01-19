import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		build: {
			target: ["es2021"],
			rollupOptions: {
				plugins: [visualizer()],
			},
		},
		plugins: [vue()],
		server: {
			port: 4200,
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@scss": path.resolve(__dirname, "./src/assets/scss"),
				"@gql": path.resolve(__dirname, "./src/assets/gql"),
				"@components": path.resolve(__dirname, "./src/components"),
				"@structures": path.resolve(__dirname, "./src/structures"),
			},
		},
	});
};
