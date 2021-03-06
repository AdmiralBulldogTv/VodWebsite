import { createApp, h, provide } from "vue";
import App from "@/App.vue";
import router from "@/router";
import { store, key } from "@/store";
import { createHead } from "@vueuse/head";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { DefaultApolloClient } from "@vue/apollo-composable";

import { apolloClient } from "@/apollo";

import "@/icons";

const app = createApp({
	setup() {
		provide(DefaultApolloClient, apolloClient);
	},
	render: () => h(App),
});

app.use(createHead()).use(store, key).use(router).component("font-awesome-icon", FontAwesomeIcon);

app.mount("#app");
