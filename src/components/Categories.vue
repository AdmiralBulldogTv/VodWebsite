<template>
	<div :data-id="id" class="categroy-wrapper">
		<div class="category-select">
			<a
				v-for="(category, i) in vod.categories"
				:key="i"
				:href="`?start=${diff(vod.started_at, category.timestamp)}`"
				class="item"
				@click.prevent="seek(diff(vod.started_at, category.timestamp))"
			>
				<img :src="category.url" class="category-img" />
				<div class="category-name" :data-ts="category.timestamp">{{ category.name }}</div>
			</a>
		</div>
	</div>
</template>

<script lang="ts">
import { Vod } from "@/structures/vod";
import dayjs from "dayjs";
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType } from "vue";

export default defineComponent({
	props: {
		vod: {
			type: Object as PropType<Vod>,
			required: true,
		},
	},
	emits: {
		seek: (value: number, isDrag: boolean) => {
			// eslint-disable-line @typescript-eslint/no-unused-vars
			return true;
		},
		close: () => {
			return true;
		},
	},
	setup(props, { emit }) {
		const id = `${Math.random() * 100000}`;

		const onClick = (evt: MouseEvent) => {
			let target = evt.target as HTMLElement | null;
			while (target !== null) {
				if (target.dataset.id === id) {
					return;
				}
				target = target.parentElement;
			}
			emit("close");
			evt.preventDefault();
			evt.stopPropagation();
		};
		let set = false;
		onMounted(() => {
			setTimeout(() => {
				if (set) return;
				window.addEventListener("click", onClick);
			}, 100);
		});
		onBeforeUnmount(() => {
			set = true;
			window.removeEventListener("click", onClick);
		});

		return {
			id,
			vod: computed(() => props.vod), // eslint-disable-line vue/no-dupe-keys
			diff(start: string, end: string): number {
				return Math.floor(dayjs(end).diff(start) / 1000);
			},
			seek(value: number) {
				emit("seek", value, false);
				emit("close");
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.item {
	display: flex;
	font: inherit;
	background-color: transparent;
	border: 0;
	color: inherit;
	padding: 0.5em;
	width: 100%;
	grid-gap: 0.5em;
	place-items: center;
	cursor: pointer;
	&:hover {
		background-color: rgba(255, 255, 255, 17.8%);
	}
}

.category-select {
	max-height: 100%;
	overflow-y: auto;
}

.categroy-wrapper {
	height: 30rem;
}

img {
	height: 4em;
}
</style>
