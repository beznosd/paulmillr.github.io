import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Event } from 'nostr-tools'

export const useOwnProfile = defineStore('ownProfile', () => {
  const contactsEvent = ref(<Event | null>{})

  function updateContactsEvent(value: Event) {
    contactsEvent.value = value
  }

  return { contactsEvent, updateContactsEvent }
})