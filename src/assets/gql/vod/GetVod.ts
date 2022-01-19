import { Vod } from "@/structures/vod";
import gql from "graphql-tag";

export const GetVod = gql`
	query GetVod($id: ObjectID!) {
		vod(id: $id) {
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

export interface GetVod {
	vod: Vod | null;
}
