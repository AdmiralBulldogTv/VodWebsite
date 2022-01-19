<template>
	<div v-if="loading || error || vod" class="bg">
		<div v-if="loading" class="loading">
			<HourGlass class="black fast" />
		</div>
		<div v-else-if="error" class="erorr">
			<p>Failed to load vod.</p>
			<p>{{ error }}</p>
		</div>
		<div v-else-if="ready === 2" class="vod">
			<div class="player">
				<Player v-if="vod" :vod="vod" />
			</div>
			<Chat v-if="vod" :vod="vod" class="chat" />
		</div>
		<div v-else class="erorr">
			<div v-if="ready == 0">
				<span>This vod failed to encode.</span>
			</div>
			<div v-else-if="ready == 1">
				<span>This vod is still currently live.</span>
			</div>
			<div v-else-if="ready == 3">
				<span>This vod is still being processed.</span>
			</div>
			<div v-else-if="ready == 4">
				<span>This vod is in storage.</span>
			</div>
		</div>
	</div>
	<Vue404 v-else />
</template>

<script lang="ts">
import { GetVod } from "@/assets/gql/vod/GetVod";
import { useQuery } from "@vue/apollo-composable";
import { computed, defineComponent } from "vue";
import { useRoute } from "vue-router";
import HourGlass from "@/components/HourGlass.vue";
import Vue404 from "./404.vue";
import Player from "@/components/Player.vue";
import Chat from "@/components/Chat.vue";

export default defineComponent({
	components: { HourGlass, Vue404, Player, Chat },
	setup() {
		const route = useRoute();
		const { loading, result, error } = useQuery<GetVod>(
			GetVod,
			{
				id: route.params.id,
			},
			{
				fetchPolicy: "cache-first",
			}
		);

		const vod = computed(() => result.value?.vod);

		return {
			loading,
			vod,
			error,
			ready: computed(() => {
				if (!vod.value) return -1;
				switch (vod.value.state) {
					case "Ready":
						return 2;
					case "Failed":
						return 0;
					case "Live":
						return 1;
					case "Processing":
						for (const v of vod.value.variants) {
							if (v.ready) return 2;
						}
						return 3;
					case "Queued":
						return 3;
					case "Storage":
						return 4;
				}
				return 0;
			}),
		};
	},
});
</script>

<style lang="scss" scoped>
@import "@scss/vod.scss";
</style>
