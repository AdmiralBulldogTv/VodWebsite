import { Vod } from "@/structures/vod";
import gql from "graphql-tag";

export const GetVods = gql`
	query GetVods($user_id: ObjectID!, $limit: Int!, $page: Int!, $search: String, $after: Time, $before: Time) {
		vods(user_id: $user_id, limit: $limit, page: $page, search: $search, after: $after, before: $before) {
			id
			user_id
			title
			categories {
				timestamp
				name
				url
			}
			state
			variants {
				name
				width
				height
				fps
				bitrate
				ready
			}
			thumbnails {
				static
				animated
			}
			started_at
			ended_at
		}
	}
`;

export interface GetVods {
	vods: Vod[] | null;
}
