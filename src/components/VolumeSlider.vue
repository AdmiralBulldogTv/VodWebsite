<template>
	<div ref="bar" class="bar" @click="onClick" @mousedown.prevent="dragging = true">
		<div class="filled-bar" :style="`width: ${(value / max) * 100}%`" />
		<div class="ball" :style="`left: ${(value / max) * 100}%`" />
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
	},
	emits: {
		update: (value: number) => {
			// eslint-disable-line @typescript-eslint/no-unused-vars
			return true;
		},
	},
	setup(props, { emit }) {
		const max = computed(() => props.max);
		const min = computed(() => props.min);
		const value = computed(() => props.value);

		const bar = ref<HTMLElement>();
		const dragging = ref(false);

		const onMouseUp = () => {
			dragging.value = false;
		};

		const onMouseMove = (evt: MouseEvent) => {
			if (!dragging.value) return;

			const pos = bar.value!.getBoundingClientRect();
			const val =
				Math.round(
					Math.max(Math.min(((evt.clientX - pos.x) / pos.width) * max.value, max.value), min.value) * 100
				) / 100;
			emit("update", val);
		};

		window.addEventListener("mouseup", onMouseUp);
		window.addEventListener("mousemove", onMouseMove);
		onBeforeUnmount(() => {
			window.removeEventListener("mouseup", onMouseUp);
			window.removeEventListener("mousemove", onMouseMove);
		});

		return {
			max, // eslint-disable-line vue/no-dupe-keys
			min, // eslint-disable-line vue/no-dupe-keys
			value, // eslint-disable-line vue/no-dupe-keys
			dragging,

			bar,
			onClick(evt: MouseEvent) {
				const pos = bar.value!.getBoundingClientRect();
				const val =
					Math.round(
						Math.max(Math.min(((evt.clientX - pos.x) / pos.width) * max.value, max.value), min.value) * 100
					) / 100;
				emit("update", val);
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.bar {
	position: relative;
	width: 100%;
	height: 0.25em;
	background-color: #999;
	border-radius: 0.25em;
	cursor: pointer;
}

.filled-bar {
	position: absolute;
	max-width: 100%;
	height: 0.25em;
	background-color: #fff;
	border-radius: 0.25em;
	pointer-events: none;
}

.ball {
	position: absolute;
	height: 0.5em;
	width: 0.5em;
	max-width: 100%;
	top: -0.125em;
	background-color: #768adf;
	border-radius: 50%;
	transform: translateX(-0.25em);
	cursor: pointer;
}
</style>
