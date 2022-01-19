<template>
	<div v-if="page === 'main'" class="settings-main" :data-id="id">
		<button class="item" @click="page = 'quality'">
			<span class="icon"><font-awesome-icon :icon="['fas', 'sliders-h']" /></span>
			<span class="name">Quality</span>
			<span class="value">{{ qualityValue }}</span>
			<span class="icon"><font-awesome-icon :icon="['fas', 'chevron-right']" /></span>
		</button>
		<button class="item" @click="page = 'speed'">
			<span class="icon"><font-awesome-icon :icon="['fas', 'play-circle']" /></span>
			<span class="name">Playback Speed</span>
			<span class="value">{{ speedValue }}</span>
			<span class="icon"><font-awesome-icon :icon="['fas', 'chevron-right']" /></span>
		</button>
	</div>
	<div v-else-if="page === 'quality'" class="settings-quality" :data-id="id">
		<button class="item no-hover border-bottom" @click="page = 'main'">
			<span class="icon"><font-awesome-icon :icon="['fas', 'chevron-right']" class="flip" /></span>
			<span class="name">Quality</span>
		</button>
		<button v-for="(item, i) in qualityValues" :key="i" class="item" @click="updateQuality(item)">
			<span class="icon">
				<font-awesome-icon v-if="qualityValue.startsWith(item)" :icon="['fas', 'check']" />
			</span>
			<span class="name">{{ item }}</span>
		</button>
	</div>
	<div v-else-if="page === 'speed'" class="settings-speed" :data-id="id">
		<button class="item no-hover border-bottom" @click="page = 'main'">
			<span class="icon"><font-awesome-icon :icon="['fas', 'chevron-right']" class="flip" /></span>
			<span class="name">Playback Speed</span>
		</button>
		<button v-for="(item, i) in playbackSpeeds" :key="i" class="item" @click="updateSpeed(item)">
			<span class="icon">
				<font-awesome-icon v-if="speedValue.startsWith(item)" :icon="['fas', 'check']" />
			</span>
			<span class="name">{{ item }}</span>
		</button>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref } from "vue";

export default defineComponent({
	props: {
		qualityValue: {
			type: String,
			required: true,
		},
		speedValue: {
			type: String,
			required: true,
		},
		qualityValues: {
			type: Object as PropType<string[]>,
			required: true,
		},
	},
	emits: {
		qualityChange: (value: string) => {
			// eslint-disable-line @typescript-eslint/no-unused-vars
			return true;
		},
		speedChange: (value: string) => {
			// eslint-disable-line @typescript-eslint/no-unused-vars
			return true;
		},
		close: () => {
			return true;
		},
	},
	setup(props, { emit }) {
		const page = ref("main");

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
			page,
			updateQuality(value: string) {
				emit("qualityChange", value);
				page.value = "main";
			},
			updateSpeed(value: string) {
				emit("speedChange", value);
				page.value = "main";
			},
			playbackSpeeds: computed(() => ["0.25", "0.5", "0.75", "Normal", "1.25", "1.5", "1.75", "2"]),
			qualityValues: computed(() => props.qualityValues), // eslint-disable-line vue/no-dupe-keys
			qualityValue: computed(() => props.qualityValue), // eslint-disable-line vue/no-dupe-keys
			speedValue: computed(() => props.speedValue), // eslint-disable-line vue/no-dupe-keys
		};
	},
});
</script>

<style lang="scss" scoped>
.settings-main {
	padding: 0.5em 0;
}

.settings-quality {
	width: 15rem;
}

.settings-speed {
	width: 15rem;
}

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
	.value {
		margin-left: auto;
		font-weight: 200;
		font-size: 0.9em;
	}
	> * {
		padding: 0.25em;
		display: grid;
		place-items: center;
	}
	cursor: pointer;

	&:not(.no-hover) {
		&:hover {
			background-color: rgba(255, 255, 255, 17.8%);
		}
	}
	&.border-bottom {
		border-bottom: 0.1em solid rgba(255, 255, 255, 17.8%);
		margin-bottom: 0.5em;
	}
}

.icon {
	width: 1em;
}
</style>
