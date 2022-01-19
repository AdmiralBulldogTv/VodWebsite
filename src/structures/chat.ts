export interface Chat {
	id: string;
	vod_id: string;
	twitch: ChatTwitch;
	timestamp: string;
	content: string;
	badges: ChatBadge[];
	emotes: ChatEmote[];
}

export interface ChatTwitch {
	id: string;
	user_id: string;
	login: string;
	display_name: string;
	color: string;
}

export interface ChatBadge {
	name: string;
	urls: string[];
}

export interface ChatEmote {
	name: string;
	zero_width: boolean;
	urls: string[];
}
