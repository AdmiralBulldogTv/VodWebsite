<template>
	<div ref="el" class="player" @mouseleave="onMouseLeave" @mousemove="onMouseMove">
		<video ref="video" :class="{ shown }" :style="shown ? '' : 'cursor: none;'" />
		<div class="controls-container" :class="{ shown }">
			<router-link
				to="/"
				class="close"
				data-text="Back to home"
				@mouseenter="onMouseEnterBtn"
				@mouseleave="onMouseLeaveBtn"
			>
				<font-awesome-icon class="flip" :icon="['fas', 'times']" />
			</router-link>
			<div class="controls">
				<div ref="slider" class="playtime-slider">
					<div
						ref="hoverModel"
						class="hover-model"
						:style="`left: ${hoverPosition}; visibility: ${
							hoverPosition ? 'visible' : 'hidden'
						}; opacity: ${hoverPosition ? hoverOpacity : 0}`"
						:class="{ settingsOpen, categoriesOpen }"
					>
						<Settings
							v-if="settingsOpen"
							:speed-value="speedValue"
							:quality-values="qualityValues"
							:quality-value="qualityValue"
							@qualityChange="qualityChangeRequest"
							@speedChange="speedChangeRequest"
							@close="settingsOpen = false"
						/>
						<Categories
							v-else-if="categoriesOpen"
							:vod="vod"
							@close="categoriesOpen = false"
							@seek="seekRequest"
						/>
						<span v-else>
							{{ hoverModelContent }}
						</span>
					</div>
					<PlaytimeSlider
						:hide-model="settingsOpen"
						:max="duration"
						:min="0"
						:value="currentTime"
						:hover-model-content="hoverModelContent"
						@update="seekRequest"
						@mouseup="seekMouseUp"
					/>
				</div>
				<div class="buttons" @mouseleave="volumeSliderExpand = false">
					<button
						ref="categoriesBtnEl"
						class="control-button"
						data-text="Category Select"
						@click="toggleCategory"
						@mouseenter="onMouseEnterBtn"
						@mouseleave="onMouseLeaveBtn"
					>
						<font-awesome-icon :icon="['fas', 'book']" />
					</button>
					<button
						class="control-button"
						:data-text="playing ? `Pause (k)` : `Play (k)`"
						@click="togglePlay"
						@mouseenter="onMouseEnterBtn"
						@mouseleave="onMouseLeaveBtn"
					>
						<font-awesome-icon v-if="playing" :icon="['fas', 'pause']" />
						<font-awesome-icon v-else :icon="['fas', 'play']" />
					</button>
					<div class="volume-controls" @mouseenter="volumeSliderExpand = true">
						<button
							class="control-button"
							:data-text="muted ? `Unmute (m)` : `Mute (m)`"
							@click="toggleMute"
							@mouseenter="onMouseEnterBtn"
							@mouseleave="onMouseLeaveBtn"
						>
							<font-awesome-icon v-if="muted" :icon="['fas', 'volume-mute']" />
							<font-awesome-icon v-else-if="volume == 0" :icon="['fas', 'volume-off']" />
							<font-awesome-icon v-else-if="volume == 1" :icon="['fas', 'volume-up']" />
							<font-awesome-icon v-else :icon="['fas', 'volume-down']" />
						</button>
						<div class="volume-slider" :class="{ expanded: volumeSliderExpand }">
							<VolumeSlider :max="1" :min="0" :value="volume" @update="volumeChangeRequest" />
						</div>
					</div>
					<div class="current-time">{{ currentTimeText }} / {{ durationText }}</div>
					<button
						ref="settingsBtnEl"
						class="control-button right"
						data-text="Settings"
						@click="toggleSettings"
						@mouseenter="onMouseEnterBtn"
						@mouseleave="onMouseLeaveBtn"
					>
						<font-awesome-icon :icon="['fas', 'cog']" />
					</button>
					<button
						class="control-button"
						:data-text="fullscren ? `Exit fullscreen (f)` : `Fullscreen (f)`"
						@click="toggleFullscreen"
						@mouseenter="onMouseEnterBtn"
						@mouseleave="onMouseLeaveBtn"
					>
						<font-awesome-icon v-if="fullscren" :icon="['fas', 'compress']" />
						<font-awesome-icon v-else :icon="['fas', 'expand']" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import Hls from "hls.js";
import { computed, defineComponent, onBeforeUnmount, PropType, reactive, ref, watch } from "vue";
import VolumeSlider from "@components/VolumeSlider.vue";
import PlaytimeSlider from "@components/PlaytimeSlider.vue";
import Settings from "@components/Settings.vue";
import { Vod, VodVariant } from "@structures/vod";
import Categories from "./Categories.vue";
import { useStore } from "@/store";
import { useRoute } from "vue-router";
import canAutoplay from "can-autoplay";

interface SelectedVariant {
	variant?: VodVariant;
	auto: boolean;
}

export default defineComponent({
	props: {
		vod: {
			type: Object as PropType<Vod>,
			required: true,
		},
	},
	setup(props) {
		const route = useRoute();
		let startTime = typeof route.query.start === "string" ? parseInt(route.query.start) : 0;
		if (startTime < 0) {
			startTime = 0;
		}
		history.replaceState({}, "", window.location.href.replace(window.location.search, ""));
		const video = ref<HTMLVideoElement>();
		const el = ref<HTMLElement>();
		const playing = ref(false);
		const fullscren = ref(false);
		const mouseMove = ref(false);
		const volumeSliderExpand = ref(false);
		const muted = ref(false);
		const volume = ref(0);
		const store = useStore();
		const currentTime = reactive({
			get value() {
				return store.getters.vodTime;
			},
			set value(value: number) {
				store.commit("SET_VOD_TIME", value);
			},
		});
		const duration = ref(0);
		const refSeekDragging = ref(false);

		let src = `${import.meta.env.VITE_APP_CDN_URL}/${props.vod.id}/master.m3u8`;
		const speedValue = ref("Normal");
		const shown = computed(() => !playing.value || mouseMove.value || settingsOpen.value);
		let inst: Hls;
		let noHlsjs = {
			selectedLevel: -1,
		};
		const variants = ref<VodVariant[]>([]);
		const selectedVariant = ref<SelectedVariant>({
			auto: true,
		});
		watch(video, () => {
			if (inst) inst.destroy();

			if (!video.value) return;
			video.value.onplay = () => {
				playing.value = true;
			};
			video.value.onpause = () => {
				playing.value = false;
			};
			video.value.onvolumechange = () => {
				muted.value = video.value?.muted || false;
				volume.value = video.value?.volume || 0;
			};
			video.value.ontimeupdate = () => {
				currentTime.value = video.value?.currentTime || 0;
				if (!refSeekDragging.value) {
					virtualCurrentTime.value = -1;
				}
			};
			video.value.ondurationchange = () => {
				duration.value = video.value?.duration || 0;
			};
			video.value.onratechange = () => {
				if (video.value?.playbackRate === 1) {
					speedValue.value = "Normal";
				} else {
					speedValue.value = `${Math.round(video.value!.playbackRate * 100) / 100}`;
				}
			};
			playing.value = !video.value.paused;
			muted.value = video.value!.muted;
			volume.value = video.value!.volume;
			currentTime.value = video.value!.currentTime;
			duration.value = video.value!.duration;
			if (video.value.playbackRate === 1) {
				speedValue.value = "Normal";
			} else {
				speedValue.value = `${Math.round(video.value.playbackRate * 100) / 100}`;
			}
			const el = video.value;
			if (Hls.isSupported()) {
				inst = new Hls();
				inst.loadSource(src);
				inst.attachMedia(el);
				inst.on(Hls.Events.LEVEL_LOADED, () => {
					let vs: VodVariant[] = [];
					inst.levels.forEach((v) => {
						vs.push({
							bitrate: v.bitrate,
							fps: parseInt(v.attrs["FRAME-RATE"]!),
							height: v.height,
							width: v.width,
							name: v.name!,
							ready: true,
						});
					});
					variants.value = vs;
				});
			} else if (el.canPlayType("application/vnd.apple.mpegurl")) {
				el.src = src;
				variants.value = props.vod.variants.filter(v => v.ready);
			}
			video.value.currentTime = startTime;
			canAutoplay
				.video()
				.then(() => video.value?.play())
				.catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
		});
		const onfullscreen = () => {
			fullscren.value = !!document.fullscreenElement;
		};
		document.addEventListener("fullscreenchange", onfullscreen);
		let stopped = false;

		let timeout: NodeJS.Timeout; // eslint-disable-line no-undef
		const formatSeconds = (seconds: number) => {
			let hours = (seconds - (seconds % 3600)) / 3600;
			let mins = (seconds - hours * 3600 - (seconds % 60)) / 60;
			let secs = seconds - hours * 3600 - mins * 60 - (seconds % 1);
			if (isNaN(hours)) hours = 0;
			if (isNaN(mins)) mins = 0;
			if (isNaN(secs)) secs = 0;
			return `${hours}:${`${mins}`.padStart(2, "0")}:${`${secs}`.padStart(2, "0")}`;
		};

		const virtualCurrentTime = ref(-1);
		const computedCurrentTime = computed(() => {
			if (virtualCurrentTime.value !== -1) return virtualCurrentTime.value;
			return currentTime.value;
		});

		const hoverModelContent = ref("");

		const slider = ref<HTMLElement>();
		const hoverModel = ref<HTMLElement>();

		const hoverPosition = ref("");
		const hoverOpacity = ref(0);
		const settingsOpen = ref(false);
		const categoriesOpen = ref(false);
		const settingsBtnEl = ref<HTMLElement>();
		const categoriesBtnEl = ref<HTMLElement>();
		const hoverEl = ref<HTMLElement | null>(null);
		const ir = () => {
			if (stopped) return;
			window.requestAnimationFrame(() => {
				if (inst) {
					selectedVariant.value.auto = inst.autoLevelEnabled;
					if (inst.loadLevel !== -1) {
						const level = inst.levels[inst.loadLevel];
						if (level && selectedVariant.value.variant?.name !== level.name) {
							selectedVariant.value.variant = {
								bitrate: level.bitrate,
								fps: parseInt(level.attrs["FRAME-RATE"]!),
								height: level.height,
								width: level.width,
								name: level.name!,
								ready: true,
							};
						}
					}
				} else if (video.value) {
					selectedVariant.value.auto = noHlsjs.selectedLevel === -1;
					if (noHlsjs.selectedLevel === -1) {
						selectedVariant.value.variant = variants.value.find(
							(v) => v.height === video.value!.videoHeight
						);
					} else {
						selectedVariant.value.variant = variants.value[noHlsjs.selectedLevel];
					}
				}
				if (
					!slider.value ||
					!hoverModel.value ||
					(settingsOpen.value && !settingsBtnEl.value) ||
					(categoriesOpen.value && !categoriesBtnEl.value) ||
					(!settingsOpen.value && !categoriesOpen.value && !hoverEl.value)
				)
					hoverPosition.value = "";
				else {
					const current = hoverModelContent.value;
					if (
						!categoriesOpen.value &&
						!settingsOpen.value &&
						current !== (hoverEl.value!.dataset.text || "")
					) {
						hoverModelContent.value = hoverEl.value!.dataset.text || "";
						hoverPosition.value = "";
					} else {
						const rects = hoverModel.value.getBoundingClientRect();
						const width = rects.width;
						const barRects = slider.value.getBoundingClientRect();
						const barWidth = barRects.width + barRects.x * 2;
						const elRects = (
							settingsOpen.value
								? settingsBtnEl.value!
								: categoriesOpen.value
								? categoriesBtnEl.value!
								: hoverEl.value!
						).getBoundingClientRect();

						const x = (width / 2 + barRects.x) / barWidth;
						let percent = (elRects.x + elRects.width / 2) / barWidth;
						if (percent < x) {
							percent = x;
						} else if (percent > 1 - x) {
							percent = 1 - x;
						}

						const previous = hoverPosition.value;
						if (previous !== `${percent * 100}%`) {
							hoverPosition.value = `${percent * 100}%`;
						} else {
							hoverOpacity.value = 1;
						}
					}
				}
				ir();
			});
		};

		ir();

		const togglePlay = () => {
			if (video.value?.paused) {
				video.value.play().catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
			} else {
				video.value?.pause();
			}
		};

		const toggleFullscreen = () => {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				el.value?.requestFullscreen().catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
			}
		};

		const volumeChangeRequest = (value: number) => {
			video.value!.volume = value;
		};
		const toggleMute = () => {
			video.value!.muted = !video.value!.muted;
		};

		const seekMouseUp = () => {
			video.value!.currentTime = virtualCurrentTime.value;
			refSeekDragging.value = false;
			virtualCurrentTime.value = -1;
		};

		const seekRequest = (value: number, isDrag: boolean) => {
			if (!isDrag) {
				video.value!.currentTime = value;
			} else {
				refSeekDragging.value = true;
			}
			virtualCurrentTime.value = value;
		};

		const onMouseMove = () => {
			if (timeout) clearTimeout(timeout);
			mouseMove.value = true;
			timeout = setTimeout(() => {
				mouseMove.value = false;
			}, 2500);
		};

		// hotkeys
		const onKeyDown = (evt: KeyboardEvent) => {
			switch (evt.code) {
				case "KeyK":
				case "Space":
					togglePlay();
					onMouseMove();
					return;
				case "KeyM":
					toggleMute();
					onMouseMove();
					return;
				case "ArrowUp":
					volumeChangeRequest(Math.min(volume.value + 0.1, 1));
					onMouseMove();
					return;
				case "ArrowDown":
					volumeChangeRequest(Math.max(volume.value - 0.1, 0));
					onMouseMove();
					return;
				case "ArrowRight":
					seekRequest(
						Math.min(
							(virtualCurrentTime.value === -1 ? currentTime.value : virtualCurrentTime.value) + 30,
							duration.value
						),
						true
					);
					onMouseMove();
					return;
				case "ArrowLeft":
					seekRequest(
						Math.max(
							(virtualCurrentTime.value === -1 ? currentTime.value : virtualCurrentTime.value) - 30,
							0
						),
						true
					);
					onMouseMove();
					return;
				case "Period":
					seekRequest(
						Math.min(
							(virtualCurrentTime.value === -1 ? currentTime.value : virtualCurrentTime.value) + 5,
							duration.value
						),
						true
					);
					onMouseMove();
					return;
				case "Comma":
					seekRequest(
						Math.max(
							(virtualCurrentTime.value === -1 ? currentTime.value : virtualCurrentTime.value) - 5,
							0
						),
						true
					);
					onMouseMove();
					return;
			}
		};
		const onKeyUp = (evt: KeyboardEvent) => {
			switch (evt.code) {
				case "ArrowRight":
				case "ArrowLeft":
				case "Period":
				case "Comma":
					seekMouseUp();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

		onBeforeUnmount(() => {
			stopped = true;
			document.removeEventListener("fullscreenchange", onfullscreen);
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("keyup", onKeyUp);
			inst.destroy();
		});

		return {
			video,
			el,
			settingsOpen,
			categoriesOpen,
			categoriesBtnEl,
			shown: computed(() => shown.value || refSeekDragging.value),
			qualityValue: computed(() => {
				if (!selectedVariant.value.variant) {
					return "Auto";
				}
				return `${selectedVariant.value.auto ? "Auto " : ""}${selectedVariant.value.variant.height}p${
					selectedVariant.value.variant.fps !== 30 ? `${selectedVariant.value.variant.fps}` : ""
				}`;
			}),
			qualityValues: computed(() => {
				const values = ["Auto"];
				variants.value.forEach((v) => {
					values.push(`${v.height}p${v.fps !== 30 ? `${v.fps}` : ""}`);
				});
				return values.reverse();
			}),
			volumeSliderExpand,
			playing,
			fullscren,
			muted,
			volume,
			hoverModelContent,
			slider,
			hoverModel,
			hoverPosition,
			hoverEl,
			hoverOpacity,
			variants,
			settingsBtnEl,
			speedValue,
			qualityChangeRequest(value: string) {
				const values = [["Auto", ""]];
				variants.value.forEach((v) => {
					values.push([`${v.height}p${v.fps !== 30 ? `${v.fps}` : ""}`, v.name]);
				});
				const name = values.find((v) => v[0] === value)![1];
				if (inst) {
					if (name === "") {
						inst.currentLevel = -1;
					} else {
						inst.nextLevel = inst.levels.findIndex((v) => v.name === name);
					}
				} else {
					if (name === "") {
						video.value!.src = src;
					} else {
						video.value!.src = `${import.meta.env.VITE_APP_CDN_URL}/${props.vod.id}/${name}/playlist.m3u8`;
						noHlsjs.selectedLevel = variants.value.findIndex((v) => v.name === name);
					}
				}
			},
			speedChangeRequest(value: string) {
				if (value === "Normal") {
					video.value!.playbackRate = 1;
				} else {
					video.value!.playbackRate = parseFloat(value);
				}
			},
			toggleSettings() {
				settingsOpen.value = !settingsOpen.value;
			},
			toggleCategory() {
				categoriesOpen.value = !categoriesOpen.value;
			},
			onMouseEnterBtn(evt: MouseEvent) {
				hoverEl.value = evt.target as HTMLElement;
			},
			onMouseLeaveBtn() {
				hoverEl.value = null;
			},
			currentTimeText: computed(() => formatSeconds(computedCurrentTime.value)),
			durationText: computed(() => formatSeconds(duration.value)),
			currentTime: computed(() => computedCurrentTime.value),
			duration: computed(() => duration.value),
			seekMouseUp,
			onMouseLeave() {
				if (timeout) clearTimeout(timeout);
				mouseMove.value = true;
				timeout = setTimeout(() => {
					mouseMove.value = false;
				}, 500);
			},
			toggleFullscreen,
			togglePlay,
			seekRequest,
			volumeChangeRequest,
			toggleMute,
			onMouseMove,
		};
	},
	components: { VolumeSlider, PlaytimeSlider, Settings, Categories },
});
</script>

<style lang="scss" scoped>
.player {
	position: relative;
	width: 100%;
	height: 100%;
}

video {
	width: 100%;
	height: 100%;
}

.controls-container {
	position: absolute;
	display: flex;
	bottom: 0;
	background: linear-gradient(
		0deg,
		rgba(0, 0, 0, 60%) 30%,
		rgba(0, 0, 0, 50%) 60%,
		rgba(0, 0, 0, 20%) 80%,
		rgba(0, 0, 0, 0%) 100%
	);
	z-index: 1;
	width: 100%;
	opacity: 0;
	transition: all 200ms ease;
	padding-top: 10%;
	cursor: auto;
	&:hover,
	&.shown,
	&:focus-within {
		opacity: 1;
		pointer-events: all;
	}
}

.controls {
	margin-top: auto;
	margin-bottom: auto;
	padding: 0.5em;
	display: flex;
	flex-direction: column;
	font-size: 1.5em;
	width: 100%;
}

.buttons {
	display: flex;
	grid-gap: 0.25em;
}

.control-button {
	width: 2em;
	height: 2em;
	font: inherit;
	padding: 0.5em;
	border: 0;
	border-radius: 0.25em;
	background-color: transparent;
	color: rgba(255, 255, 255, 70.5%);
	transition: all 200ms ease;
	&:hover {
		color: white;
	}
	&:hover + .volume-slider {
		width: 6.5em;
	}
}

.volume-slider {
	width: 0;
	&:hover,
	&.expanded {
		width: 6.5em;
		padding-right: 0.5em;
	}
	transition: all 150ms ease;
	display: grid;
	place-items: center;
}

.right {
	margin-left: auto;
}

.current-time {
	display: grid;
	place-items: center;
}

.categories {
	display: grid;
	place-items: center;
	position: relative;
	width: 2em;
}

.categories-wrapper {
	position: absolute;
	height: 10em;
	display: grid;
	place-items: center;
	bottom: 0;
	> * {
		position: absolute;
		bottom: 0;
	}
}

.volume-controls {
	display: flex;
}

.hover-model {
	position: absolute;
	user-select: none;
	transform: translateX(-50%) translateY(-100%);
	white-space: nowrap;
	font-size: 0.8em;
	font-weight: 500;
	background-color: #252525e7;
	transition: opacity 250ms ease;
	&:not(.settingsOpen):not(.categoriesOpen) {
		padding: 0.25em 0.5em;
	}
	&.settingsOpen,
	&.categoriesOpen {
		border-radius: 0.25em;
	}
}

.close {
	position: fixed;
	left: 0.5em;
	top: 0.5em;
	font: inherit;
	color: inherit;
	background-color: transparent;
	border: 0;
	padding: 0;
	font-size: 2em;
	opacity: 0.9;
	svg {
		stroke: black;
		stroke-width: 1em;
	}
	z-index: 1;
}
</style>
