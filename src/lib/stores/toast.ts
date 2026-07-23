import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		add: (message: string, type: ToastType = 'info', duration: number = 4000) => {
			const id = Math.random().toString(36).substring(2, 9);
			const toast: Toast = { id, message, type, duration };

			update((toasts) => [...toasts, toast]);

			if (duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, duration);
			}
		},
		success: (message: string, duration?: number) => {
			createToastStoreInstance.add(message, 'success', duration);
		},
		error: (message: string, duration?: number) => {
			createToastStoreInstance.add(message, 'error', duration);
		},
		warning: (message: string, duration?: number) => {
			createToastStoreInstance.add(message, 'warning', duration);
		},
		info: (message: string, duration?: number) => {
			createToastStoreInstance.add(message, 'info', duration);
		},
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}
	};
}

export const toastStore = createToastStore();
const createToastStoreInstance = toastStore;
