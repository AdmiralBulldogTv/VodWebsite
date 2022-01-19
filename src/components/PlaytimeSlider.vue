<template>
	<div class="bar-wrapper-wrapper" :class="{ active: dragging }" @click="onClick" @mousedown.prevent="startDragging">
		<div ref="hoverModel" class="hover-model" :style="`left: ${hoverPosition}; opacity: ${hideModel ? 0 : 1};`">
			{{ formatSeconds(hoverValue) }}
		</div>
		<div class="bar-wrapper">
			<div ref="bar" class="bar">
				<div class="overflow-container">
					<div class="hover-bar" :style="`width: ${(hoverValue / max) * 100}%`" />
					<div class="filled-bar" :style="`width: ${(value / max) * 100}%`" />
				</div>
				<div class="ball" :style="`left: ${(value / max) * 100}%`" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref } from "vue";

export default defineComponent({
	props: {
		min: {
			type: Number,
			required: true,
		},
		max: {
			type: Number,
			required: true,
		},
		value: {
			type: Number,
			required: true,
		},
		hideModel: {
			type: Boolean,
			required: true,
		},
	},
	emits: {
		update: (value: number, isDrag: boolean) => {
			// eslint-disable-line @typescript-eslint/no-unused-vars
			return true;
		},
		mouseup: () => {
			return true;
		},
	},
	setup(props, { emit }) {
		const max = computed(() => props.max);
		const min = computed(() => props.min);
		const value = computed(() => props.value);
		const hoverValue = ref(0);

		const bar = ref<HTMLElement>();
		const hoverModel = ref<HTMLElement>();
		const dragging = ref(false);

		const onMouseUp = () => {
			if (dragging.value) {
				dragging.value = false;
				emit("mouseup");
			}
		};

		const onMouseMove = (evt: MouseEvent) => {
			const pos = bar.value!.getBoundingClientRect();
			const val =
				Math.round(
					Math.max(Math.min(((evt.clientX - pos.x) / pos.width) * max.value, max.value), min.value) * 100
				) / 100;
			hoverValue.value = val;
			if (!dragging.value) return;

			emit("update", val, true);
		};

		const formatSeconds = (seconds: number) => {
			let hours = (seconds - (seconds % 3600)) / 3600;
			let mins = (seconds - hours * 3600 - (seconds % 60)) / 60;
			let secs = seconds - hours * 3600 - mins * 60 - (seconds % 1);
			if (isNaN(hours)) hours = 0;
			if (isNaN(mins)) mins = 0;
			if (isNaN(secs)) secs = 0;
			if (hours === 0) return `${mins}:${`${secs}`.padStart(2, "0")}`;
			return `${hours}:${`${mins}`.padStart(2, "0")}:${`${secs}`.padStart(2, "0")}`;
		};

		window.addEventListener("mouseup", onMouseUp);
		window.addEventListener("mousemove", onMouseMove);
		let stopped = false;
		onBeforeUnmount(() => {
			stopped = true;
			window.removeEventListener("mouseup", onMouseUp);
			window.removeEventListener("mousemove", onMouseMove);
		});

		const hoverPosition = ref("");
		const ir = () => {
			if (stopped) return;
			window.requestAnimationFrame(() => {
				if (!bar.value || !hoverModel.value) hoverPosition.value = "";
				else {
					const rects = hoverModel.value.getBoundingClientRect();
					const width = rects.width;
					const barRects = bar.value.getBoundingClientRect();
					const barWidth = barRects.width;

					const x = width / 2 / barWidth;
					let percent = hoverValue.value / max.value;
					if (percent < x) {
						percent = x;
					} else if (percent > 1 - x) {
						percent = 1 - x;
					}

					hoverPosition.value = `${percent * 100}%`;
				}
				ir();
			});
		};

		ir();

		return {
			max, // eslint-disable-line vue/no-dupe-keys
			min, // eslint-disable-line vue/no-dupe-keys
			value, // eslint-disable-line vue/no-dupe-keys
			dragging,
			hoverValue,
			hideModel: computed(() => props.hideModel), // eslint-disable-line vue/no-dupe-keys

			bar,
			hoverModel,
			formatSeconds,
			hoverPosition,
			startDragging(evt: MouseEvent) {
				dragging.value = true;
				const pos = bar.value!.getBoundingClientRect();
				const val =
					Math.round(
						Math.max(Math.min(((evt.clientX - pos.x) / pos.width) * max.value, max.value), min.value) * 100
					) / 100;
				hoverValue.value = val;
			},
			onClick(evt: MouseEvent) {
				const pos = bar.value!.getBoundingClientRect();
				const val =
					Math.round(
						Math.max(Math.min(((evt.clientX - pos.x) / pos.width) * max.value, max.value), min.value) * 100
					) / 100;
				emit("update", val, false);
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.bar-wrapper-wrapper {
	position: relative;
	width: 100%;
	padding: 0.5em 0;
	cursor: pointer;

	&:hover,
	&.active {
		.bar {
			height: 0.4em;
		}
		.ball {
			transform: translateX(-0.25em) translateY(-25%) scale(1);
		}

		.hover-bar,
		.hover-model {
			display: block;
		}
	}
}

.overflow-container {
	position: absolute;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-radius: 0.1em;
}

.bar-wrapper {
	position: absolute;
	width: 100%;
	transform: translateY(5%);
}
.bar {
	position: relative;
	width: 100%;
	height: 0.25em;
	background-color: #666;
	border-radius: 0.1em;
	bottom: 0;
	cursor: pointer;
	transition: all 50ms ease;
	transform: translateY(-50%);
}

.filled-bar {
	position: absolute;
	max-width: 100%;
	height: 100%;
	background-color: #c40e0e;
	pointer-events: none;
}

.hover-bar {
	display: none;
	position: absolute;
	max-width: 100%;
	height: 100%;
	background-color: #8f8f8f;
	pointer-events: none;
}

.ball {
	position: absolute;
	height: 0.8em;
	width: 0.8em;
	background-color: #c40e0e;
	border-radius: 50%;
	transform: translateX(-0.25em) translateY(-25%) scale(0);
	cursor: pointer;
	transition: transform 50ms ease;
}

.hover-model {
	display: none;
	position: absolute;
	top: 0;
	padding: 0.1em;
	transform: translateX(-50%) translateY(-100%);
}
</style>
