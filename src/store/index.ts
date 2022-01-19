import { User } from "@structures/user";
import { InjectionKey } from "vue";
import { createStore, Store, useStore as baseUseStore } from "vuex";

export interface State {
	user: User | null;
	error: string | null;
	vodTime: number;
}

export const key: InjectionKey<Store<State>> = Symbol("vuex");

export const store = createStore<State>({
	state: {
		user: null,
		error: null,
		vodTime: 0,
	},
	getters: {
		user: (s) => s.user,
		vodTime: (s) => s.vodTime,
		error: (s) => s.error,
	},
	mutations: {
		SET_USER: (state, user: User | null) => {
			state.user = user;
		},
		SET_ERROR: (state, error: string | null) => {
			state.error = error;
		},
		SET_VOD_TIME: (state, vodTime: number) => {
			state.vodTime = vodTime;
		},
	},
	actions: {},
	modules: {},
});

export const useStore = () => {
	return baseUseStore(key);
};
