import { Chat } from "@/structures/chat";
import gql from "graphql-tag";

export const GetMessages = gql`
	query GetMessages($vod_id: ObjectID!, $limit: Int!, $page: Int!, $after: Time!, $before: Time!) {
		messages(vod_id: $vod_id, limit: $limit, page: $page, after: $after, before: $before) {
			id
			vod_id
			twitch {
				id
				user_id
				login
				display_name
				color
			}
			timestamp
			content
			badges {
				name
				urls
			}
			emotes {
				name
				urls
				zero_width
			}
		}
	}
`;

export interface GetMessages {
	messages: Chat[] | null;
}
