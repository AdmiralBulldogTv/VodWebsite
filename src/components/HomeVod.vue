<template>
	<div class="vod" :style="`--color: ${stringToColour(vod.id)}`">
		<router-link class="img" :to="`/vod/${vod.id}`">
			<img src="@/assets/img/default-thumbnail.webp" />
			<div class="img-adds">
				<div class="state" :class="vod.state.toLowerCase()">{{ vod.state }}</div>
				<div class="date" :title="startedAtNeat">{{ startedAt }}</div>
				<div v-if="duration" class="duration">{{ duration }}</div>
			</div>
			<div class="left"><div class="square"></div></div>
			<div class="bottom"><div class="square"></div></div>
		</router-link>
		<router-link class="title-link" :to="`/vod/${vod.id}`">
			<div class="title" :title="vod.title">{{ vod.title || "Missing Title" }}</div>
		</router-link>
		<div>
			<button
				class="category-button"
				:data-cat-vod-id="vod.id"
				:class="{ categoriesOpen }"
				:disabled="vod.categories.length === 0"
				@click="toggleCategories"
			>
				<div class="category">{{ vod.categories.length }} Categories</div>
				<div class="category-select">
					<router-link
						v-for="(category, i) in vod.categories"
						:key="i"
						:to="`/vod/${vod.id}?start=${diff(vod.started_at, category.timestamp)}`"
						class="item"
					>
						<img :src="category.url" class="category-img" />
						<div class="category-name" :data-ts="category.timestamp">{{ category.name }}</div>
					</router-link>
				</div>
				<div class="click-controller" @click.stop.prevent="categoriesOpen = false"></div>
			</button>
		</div>
	</div>
</template>

<script lang="ts">
import { Vod } from "@structures/vod";
import { computed, defineComponent, onBeforeUnmount, PropType, ref } from "vue";
import dayjs from "dayjs";

export default defineComponent({
	props: {
		vod: {
			type: Object as PropType<Vod>,
			required: true,
		},
	},
	setup(props) {
		const stringToColour = (str: string) => {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				hash = str.charCodeAt(i) + ((hash << 5) - hash);
			}
			let colour = "#";
			for (var i = 0; i < 3; i++) {
				let value = (hash >> (i * 8)) & 255;
				colour += value.toString(16).substring(-2);
			}
			return colour;
		};
		const formatMills = (seconds: number) => {
			const hours = (seconds - (seconds % 3600)) / 3600;
			const mins = (seconds - hours * 3600 - (seconds % 60)) / 60;
			const secs = seconds - hours * 3600 - mins * 60 - (seconds % 1);
			return `${hours}:${`${mins}`.padStart(2, "0")}:${`${secs}`.padStart(2, "0")}`;
		};

		const categoriesOpen = ref(false);
		const onClick = (evt: MouseEvent) => {
			if (!categoriesOpen.value) return;
			let target = evt.target as HTMLElement | null;
			while (target !== null) {
				if (target.dataset.catVodId === props.vod.id) {
					return;
				}
				target = target.parentElement;
			}
			categoriesOpen.value = false;
			evt.preventDefault();
			evt.stopPropagation();
		};
		window.addEventListener("click", onClick);
		onBeforeUnmount(() => {
			window.removeEventListener("click", onClick);
		});

		return {
			categoriesOpen,
			toggleCategories: () => {
				categoriesOpen.value = !categoriesOpen.value;
			},
			diff(start: string, end: string): number {
				return Math.floor(dayjs(end).diff(start) / 1000);
			},
			stringToColour,
			vod: props.vod, // eslint-disable-line vue/no-dupe-keys
			duration: computed(() => {
				if (props.vod.state === "Live") return "";
				return formatMills(dayjs(props.vod.ended_at).diff(props.vod.started_at) / 1000);
			}),

			startedAt: computed(() => dayjs(props.vod.started_at).format("DD/MM/YYYY")),
			startedAtNeat: computed(() => dayjs(props.vod.started_at).format("MMMM D, YYYY h:mm A")),
		};
	},
});
</script>

<style lang="scss" scoped>
.vod {
	background-color: #1a1a1bb4;
	position: relative;
	font-size: 1.5em;
	padding: 0.5em;
}

img {
	width: 100%;
	position: relative;
	z-index: 1;
	transition: all 200ms ease;
}

.img {
	display: block;
	color: inherit;
	cursor: pointer;
	position: relative;
	&:hover {
		img,
		.img-adds {
			transform: translate(0.5em, -0.5em);
		}
		.bottom .square {
			clip-path: polygon(100% 0, 0% 100%, 0 0);
		}
		.left .square {
			clip-path: polygon(100% 2%, 0% 100%, 100% 100%);
		}
	}
}

.left {
	background-color: var(--color);
	height: calc(100% - 0.3em);
	width: 0.5em;
	position: absolute;
	left: 0;
	top: 0;
	.square {
		transition: all 200ms ease;
		clip-path: polygon(100% 100%, 0% 100%, 0 100%);
		width: 0.5em;
		height: 0.5em;
		background-color: inherit;
		position: absolute;
		top: calc(-0.5em + 0.5px);
	}
}

.bottom {
	background-color: var(--color);
	width: calc(100% - 0.5em);
	height: 0.5em;
	position: absolute;
	bottom: 0.3em;
	left: 0.5em;
	.square {
		transition: all 200ms ease;
		clip-path: polygon(0 0, 0% 100%, 0 0);
		width: 0.5em;
		height: 0.5em;
		background-color: inherit;
		position: absolute;
		right: calc(-0.5em + 0.1px);
	}
}

.img-adds {
	position: absolute;
	transition: all 200ms ease;
	z-index: 2;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 0.5em;
	.state {
		position: absolute;
		right: 0.5em;
		font-size: 0.75em;
		border-radius: 0.5em;
		padding: 0.5em;
		&.live {
			background-color: #ac2b2b;
		}
		&.ready {
			background-color: #389548;
		}
		&.queued {
			background-color: #289ea7;
		}
		&.failed {
			background-color: #953844;
		}
		&.processing {
			background-color: #c58918;
		}
	}
	.duration {
		position: absolute;
		right: 0.5em;
		font-size: 0.75em;
		border-radius: 0.5em;
		bottom: 1em;
		background-color: #273ec0;
		padding: 0.5em;
	}
	.date {
		position: absolute;
		left: 0.5em;
		font-size: 0.75em;
		border-radius: 0.25em;
		bottom: 1em;
		background-color: #222325;
		padding: 0.5em;
	}
}

.title {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
	padding: 0.25em;
}

.title-link {
	color: inherit;
}

.category-button {
	font: inherit;
	background-color: #50466d;
	color: inherit;
	padding: 0 0.5em;
	border-radius: 0.25rem;
	border: 0;
	cursor: pointer;
	&:disabled {
		cursor: inherit;
		background-color: #772c49;
	}
}

.categoriesOpen {
	background-color: rgb(58, 177, 141);
	.category-select {
		display: flex;
	}
	.click-controller {
		display: block;
	}
}

.category-select {
	display: none;
	position: absolute;
	background-color: #111114;
	border: 0.1rem solid #89898b60;
	border-radius: 0.5em;
	bottom: 0.75em;
	left: 0.75em;
	z-index: 99;
	flex-direction: column;
	grid-gap: 0.5em;
	padding: 0.5em;
	max-height: 100%;
	overflow-y: auto;
	.item {
		padding: 0.25em;
		display: flex;
		&:hover {
			background-color: #ffffff2a;
			border-radius: 0.25em;
		}
	}
}

.click-controller {
	display: none;
	z-index: 98;
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
}

.category-img {
	height: 2em;
	width: auto;
}

.category-name {
	display: grid;
	place-items: center;
	text-align: center;
	padding: 0 1em;
	flex-grow: 1;
}
</style>
