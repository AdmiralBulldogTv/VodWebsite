<template>
	<div v-if="user !== null && vods !== null" class="home">
		<header>
			<h2>{{ user.twitch.display_name }}'s VOD Site</h2>
			<div class="search">
				<font-awesome-icon :icon="['fas', 'search']" />
				<input v-model="search" :class="{ error }" />
			</div>
		</header>
		<main>
			<div v-if="!loading && vods?.length !== 0" class="vods">
				<HomeVod v-for="vod in vods" :key="vod.id" :vod="vod" />
			</div>
			<div v-else-if="loading" class="loading-vods">
				<HourGlass class="fast" />
			</div>
			<div v-else class="no-vods">
				<span>no vods found :(</span>
			</div>
		</main>
	</div>
	<div v-else class="loading">
		<HourGlass />
	</div>
</template>

<script lang="ts">
import { GetVods } from "@/assets/gql/vod/GetVods";
import { useStore } from "@/store";
import { User } from "@structures/user";
import { useQuery } from "@vue/apollo-composable";
import { computed, defineComponent, ref, watch } from "vue";
import HomeVod from "@/components/HomeVod.vue";
import HourGlass from "@components/HourGlass.vue";

export default defineComponent({
	components: { HomeVod, HourGlass },
	setup() {
		const store = useStore();
		const user = computed<User | null>(() => store.getters.user);

		const search = ref("");
		const { variables, loading, result, error } = useQuery<GetVods>(
			GetVods,
			{
				user_id: import.meta.env.VITE_APP_USER_ID,
				limit: 10,
				page: 0,
				search: search.value || null,
			},
			{
				fetchPolicy: "cache-first",
			}
		);

		let timeout: NodeJS.Timeout; // eslint-disable-line no-undef

		const fetchVods = () => {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				variables.value = {
					user_id: import.meta.env.VITE_APP_USER_ID,
					limit: 10,
					page: 0,
					search: search.value || null,
				};
			}, 75);
		};

		watch(search, () => {
			fetchVods();
		});

		return {
			user,
			vods: computed(() => result.value?.vods),
			search,
			loading,
			error,
		};
	},
});
</script>

<style lang="scss" scoped>
@import "@scss/home.scss";
</style>
