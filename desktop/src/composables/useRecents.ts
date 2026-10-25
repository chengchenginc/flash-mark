import { useRecentsStore } from '@/stores/recents'

export function useRecents() {
  const store = useRecentsStore()
  return {
    store,
    load: store.load,
    add: store.add,
    remove: store.remove,
  }
}
