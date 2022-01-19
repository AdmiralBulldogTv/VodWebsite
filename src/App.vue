<template>
	<main class="entrypoint">
		<router-view v-if="!error" />
		<div v-else>
			{{ error }}
		</div>
	</main>
</template>

<script lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { computed, defineComponent } from "vue";
import { GetUser } from "@gql/user/GetUser";
import { useStore } from "@/store";
import { useHead } from "@vueuse/head";

export default defineComponent({
	setup() {
		const store = useStore();

		const { onResult, result } = useQuery<GetUser>(GetUser, { id: import.meta.env.VITE_APP_USER_ID });
		onResult((res) => {
			if (!res.data?.user) {
				store.commit("SET_ERROR", "failed to load user from API");
				return;
			}
			store.commit("SET_USER", res.data.user);
		});

		useHead({
			title: computed(() =>
				result.value?.user?.twitch.display_name
					? `${result.value.user.twitch.display_name}'s VOD Site`
					: "Loading"
			),
		});

		const error = computed<string>(() => store.getters.error);

		return {
			error,
		};
	},
});
</script>

<style lang="scss">
@import "@scss/default.scss";
</style>
