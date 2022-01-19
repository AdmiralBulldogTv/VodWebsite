import { User } from "@/structures/user";
import gql from "graphql-tag";

export const GetUser = gql`
	query GetUser($id: ObjectID!) {
		user(id: $id) {
			id
			twitch {
				id
				login
				display_name
				profile_picture
			}
		}
	}
`;

export interface GetUser {
	user: User | null;
}
