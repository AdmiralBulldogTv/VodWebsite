import { User } from "@structures/user";

export interface Vod {
	id: string;
	user_id: string;
	title: string;
	categories: VodCategory[];
	state: VodState;
	visibility: VodVisibility;
	variants: VodVariant[];
	started_at: string;
	ended_at: string | null;

	user: User;
}

export interface VodCategory {
	timestamp: string;
	name: string;
	id: string;
	url: string;
}

export interface VodVariant {
	name: string;
	width: number;
	height: number;
	fps: number;
	bitrate: number;
	ready: boolean;
}

export type VodState = "Live" | "Queued" | "Processing" | "Ready" | "Storage" | "Failed" | "Canceled";
export type VodVisibility = "Public" | "Deleted";
