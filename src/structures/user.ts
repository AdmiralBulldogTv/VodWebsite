import { Vod } from "@structures/vod";

export interface User {
	id: string;
	twitch: UserTwitch;
	vods: Vod[];
}

export interface UserTwitch {
	id: string;
	login: string;
	display_name: string;
	profile_picture: string;
}
