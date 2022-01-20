<template>
	<div class="message">
		<span>
			<img
				v-for="(badge, i) in badges"
				:key="i"
				class="badge"
				:src="badge.urls[0]"
				:alt="`${badge.name} `"
				:title="badge.name"
			/>
		</span>
		<span class="name" :style="`color: ${msg.twitch.color || stringToColour(msg.twitch.display_name)}`">
			{{ msg.twitch.display_name }}
		</span>
		<span class="colon">: </span>
		<span v-for="(part, i) in parts" :key="i" :class="part.type">
			<img v-if="part.type === 'emote'" :src="part.emote" :alt="`${part.emote_name} `" :title="part.emote_name" />
			<a
				v-else-if="part.type === 'link'"
				:href="part.link_href.match(/https?:\/\//) ? part.link_href : 'http://' + part.link_href"
				target="_BLANK"
				>{{ part.link_href }}</a
			>
			{{ part.content }}
		</span>
	</div>
</template>

<script lang="ts">
import { Chat, ChatEmote } from "@/structures/chat";
import { computed, defineComponent, PropType } from "vue";

interface MessagePart {
	type: "content" | "emote" | "link";
	content: string;
	emote: string;
	emote_name: string;
	zero_width: boolean;
	link_href: string;
}

export default defineComponent({
	props: {
		msg: {
			type: Object as PropType<Chat>,
			required: true,
		},
	},
	setup(props) {
		const msg = computed(() => props.msg);

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

		const emotes = computed(() =>
			msg.value.emotes.reduce((acc, cur) => {
				acc[cur.name] = cur;
				return acc;
			}, {} as { [key: string]: ChatEmote })
		);

		const parts = computed(() => {
			let content = [] as string[];
			const parts = [] as MessagePart[];
			const splits = msg.value.content.split(" ");

			splits.forEach((s) => {
				if (emotes.value[s]) {
					if (content.length) {
						parts.push({
							type: "content",
							content: content.join(" "),
							emote: "",
							emote_name: "",
							zero_width: false,
							link_href: "",
						});
						content = [];
					}
					parts.push({
						type: "emote",
						content: "",
						emote: emotes.value[s].urls[0].replace(
							"https://cdn.7tv.app/emotes",
							"https://cdn.7tv.app/emote"
						),
						emote_name: emotes.value[s].name,
						zero_width: emotes.value[s].zero_width,
						link_href: "",
					});
				} else if (s.match(/^(https?:\/\/)?(\w+\.){1,}\w{2,}(.*)$/)) {
					if (content.length) {
						parts.push({
							type: "content",
							content: content.join(" "),
							emote: "",
							emote_name: "",
							zero_width: false,
							link_href: "",
						});
						content = [];
					}
					parts.push({
						type: "link",
						content: "",
						emote: "",
						emote_name: "",
						zero_width: false,
						link_href: s,
					});
				} else {
					content.push(s);
				}
			});
			if (content.length) {
				parts.push({
					type: "content",
					content: content.join(" "),
					emote: "",
					emote_name: "",
					zero_width: false,
					link_href: "",
				});
			}

			return parts;
		});

		const badges = computed(() => {
			return msg.value.badges.slice().map((v) => {
				v.urls = v.urls.slice().map((v) => {
					if (v === "https://static-cdn.jtvnw.net/chat-badges/broadcaster.png") {
						return "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2";
					}
					return v;
				});
				return v;
			});
		});

		return {
			badges,
			msg, // eslint-disable-line
			parts,
			stringToColour,
		};
	},
});
</script>

<style lang="scss" scoped>
.message {
	max-width: 100%;
	word-break: break-all;
	padding: 0.25em;
}

.colon {
	padding-right: 0.1em;
	& + .emote {
		padding-left: unset !important;
	}
}

.badge {
	vertical-align: -0.2em;
	padding-right: 0.1em;
}

.emote {
	padding-left: 0.1em;
	> img {
		vertical-align: -0.5em;
	}
	& + .emote {
		padding-left: unset !important;
	}
}

.link {
	padding-left: 0.3em;
}
</style>
