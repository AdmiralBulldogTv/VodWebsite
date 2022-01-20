<template>
	<div v-if="!collapseRoom" class="room">
		<div class="head">
			<button class="close" @click="collapseRoom = true">
				<font-awesome-icon class="flip" :icon="['fas', 'arrow-left']" /></button
			><span>Chat Room</span>
		</div>
		<div ref="chatWindow" class="main" @scroll="onScroll">
			<ChatMessage v-for="msg in messages" :key="msg.chat.id" :msg="msg.chat" />
		</div>
		<div v-if="!autoScroll" class="auto-scroll" @click="scrollToBottom">Scroll to bottom</div>
	</div>
	<div v-else style="min-width: unset">
		<button class="open" @click="collapseRoom = false"><font-awesome-icon :icon="['fas', 'arrow-left']" /></button>
	</div>
</template>

<script lang="ts">
import { GetMessages } from "@/assets/gql/chat/GetMessages";
import { useStore } from "@/store";
import { Chat } from "@/structures/chat";
import { Vod } from "@/structures/vod";
import { useQuery } from "@vue/apollo-composable";
import dayjs from "dayjs";
import { computed, defineComponent, onBeforeUnmount, PropType, ref, watch } from "vue";
import ChatMessage from "./ChatMessage.vue";

interface Message {
	chat: Chat;
	vod_time: number;
}

export default defineComponent({
	props: {
		vod: {
			type: Object as PropType<Vod>,
			required: true,
		},
	},
	setup(props) {
		const collapseRoom = ref(false);

		const store = useStore();
		const vodTime = computed(() => store.getters.vodTime as number);

		const chatStart = ref(
			dayjs(props.vod.started_at).add(vodTime.value, "seconds").diff(props.vod.started_at) / 1000
		);
		const chatEnd = ref(0);

		const autoScroll = ref(true);

		const { variables, loading, result } = useQuery<GetMessages>(
			GetMessages,
			{
				vod_id: props.vod.id,
				limit: 50,
				page: 0,
				after: dayjs(props.vod.started_at).add(vodTime.value, "seconds").toISOString(),
				before: dayjs(props.vod.ended_at).toISOString(),
			},
			{
				fetchPolicy: "cache-first",
			}
		);

		const messages = ref([] as Message[]);
		let reset = false;
		watch(result, () => {
			const res: Message[] = (result.value?.messages || []).map((v) => ({
				chat: v,
				vod_time: dayjs(v.timestamp).diff(props.vod.started_at) / 1000,
			}));
			if (res.length) {
				if (reset) {
					reset = false;
					messages.value = res;
					chatStart.value = res[0].vod_time;
				} else {
					messages.value.push(...res);
				}
				chatEnd.value = messages.value[messages.value.length - 1].vod_time;
			} else {
				chatEnd.value = dayjs(props.vod.ended_at).diff(props.vod.started_at) / 1000
			}
		});

		watch(vodTime, (newValue, oldValue) => {
			if (((newValue < oldValue && chatStart.value > newValue) || chatEnd.value < newValue) && !loading.value) {
				variables.value = {
					vod_id: props.vod.id,
					limit: 50,
					page: 0,
					after: dayjs(props.vod.started_at).add(vodTime.value, "seconds").toISOString(),
					before: dayjs(props.vod.ended_at).toISOString(),
				};
				messages.value = [];
			} else if (chatEnd.value - 120 < newValue && chatEnd.value > newValue) {
				variables.value = {
					vod_id: props.vod.id,
					limit: 50,
					page: 0,
					after: dayjs(props.vod.started_at)
						.add(chatEnd.value + 0.01, "seconds")
						.toISOString(),
					before: dayjs(props.vod.ended_at).toISOString(),
				};
			}
		});

		const chatWindow = ref<HTMLElement>();

		let scrolledAuto = false;
		const ir = setInterval(() => {
			if (autoScroll.value && chatWindow.value!.scrollTop !== chatWindow.value!.scrollHeight) {
				scrolledAuto = true;
				chatWindow.value!.scrollTop = chatWindow.value!.scrollHeight;
			}
		}, 10);

		onBeforeUnmount(() => {
			clearInterval(ir);
		});

		return {
			chatEnd,
			chatStart,
			vodTime,
			chatWindow,
			autoScroll,
			onScroll() {
				if (!scrolledAuto) {
					autoScroll.value =
						chatWindow.value!.scrollTop + chatWindow.value!.clientHeight === chatWindow.value!.scrollHeight;
				}
				scrolledAuto = false;
			},
			scrollToBottom() {
				chatWindow.value!.scrollTop = chatWindow.value!.scrollHeight;
				autoScroll.value = true;
			},
			messagesRaw: messages,
			messages: computed(() => {
				const msgs = messages.value.filter((m) => m.vod_time < vodTime.value + 12);
				return msgs.slice(Math.max(msgs.length - 250, 0), msgs.length);
			}),
			collapseRoom,
			variables: computed(() => variables.value),
		};
	},
	components: { ChatMessage },
});
</script>

<style lang="scss" scoped>
.hidden {
	min-width: unset;
}
.room {
	display: flex;
	flex-direction: column;
	height: 100%;
	max-width: 22rem;
	position: relative;
}

.head {
	width: 100%;
	background-color: rgb(26, 25, 31);
	border-bottom: 0.1rem solid rgba(255, 255, 255, 41.1%);
	display: grid;
	font-size: 2em;
	place-items: center;
	position: relative;
	padding: 0.25em;
}

.close {
	position: absolute;
	left: 0.5em;
	font: inherit;
	color: inherit;
	background-color: transparent;
	border: 0;
	padding: 0;
}

.open {
	position: absolute;
	right: 0.5em;
	top: 0.5em;
	font: inherit;
	color: inherit;
	background-color: transparent;
	border: 0;
	padding: 0;
	font-size: 2em;
}

.main {
	background-color: rgb(26, 25, 31);
	flex-grow: 1;
	max-width: 100%;
	max-height: 100%;
	overflow-y: auto;
}

.auto-scroll {
	position: absolute;
	bottom: 2rem;
	background-color: rgba(48, 187, 192, 71.2%);
	width: 90%;
	left: 5%;
	padding: 0.5em;
	text-align: center;
	border-radius: 0.5em;
	cursor: pointer;
}
</style>
