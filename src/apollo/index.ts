import { ApolloClient, createHttpLink, InMemoryCache, ApolloLink } from "@apollo/client/core";

// HTTP connection to the API
const httpLink = createHttpLink({
	// You should use an absolute URL here
	uri: `${import.meta.env.VITE_APP_GQL_URL}`,
});

// Cache implementation
const cache = new InMemoryCache({
	resultCaching: true,
});

// Create the apollo client
export const apolloClient = new ApolloClient({
	link: ApolloLink.from([httpLink]),
	cache,
	defaultOptions: {
		watchQuery: {
			fetchPolicy: "no-cache",
		},
		query: {
			fetchPolicy: "no-cache",
		},
	},
});
