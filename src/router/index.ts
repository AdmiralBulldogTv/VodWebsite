import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		name: "Home",
		component: () => import(/* webpackChunkName: "main" */ "../views/Home.vue"),
	},
	{
		path: "/vod/:id",
		name: "Vod",
		component: () => import(/* webpackChunkName: "main" */ "../views/Vod.vue"),
	},
	{
		path: "/:pathMatch(.*)*",
		name: "Not Found",
		component: () => import(/* webpackChunkName: "main" */ "../views/404.vue"),
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
