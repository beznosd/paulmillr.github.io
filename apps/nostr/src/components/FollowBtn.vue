<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { useNsec } from '@/stores/Nsec'
  import { useRelay } from '@/stores/Relay'
  import { useOwnProfile } from '@/stores/OwnProfile'
  import { usePool } from '@/stores/Pool'
  import { EVENT_KIND } from '@/nostr'
  import { finalizeEvent } from 'nostr-tools'
  import { now } from '@/utils/chat-crypto'
  import { publishEventToRelays } from '@/utils'

  const emit = defineEmits(['handleFollowed', 'handleUnfollowed', 'handleError'])

  const nsecStore = useNsec()
  const relayStore = useRelay()
  const ownProfileStore = useOwnProfile()

  const poolStore = usePool()
  const pool = poolStore.pool

  const props = defineProps<{
    isSubscribed: boolean,
    pubkeyToFollow: string,
  }>()

  const loginError = 'Please login to follow the user.'
  const relaysError = 'Something went wrong, please ensure that your write relays are online.'

  const handleFollowClick = async () => {
    const ownPubkey = nsecStore.getPubkey()
    if (!ownPubkey) {
      emit('handleError', loginError)
      return
    }

    const contacts = ownProfileStore.contactsEvent
    let tags = contacts?.tags || []

    tags.push(['p', props.pubkeyToFollow])
    
    const event = prepareContactsEvent(tags)
    if (!event) return

    emit('handleFollowed')
    const relays = relayStore.connectedUserWriteRelaysUrls
    const result = await publishEventToRelays(relays, pool, event)

    const isError = result.every((r: any) => r.success === false)
    if (isError) {
      emit('handleUnfollowed')
      emit('handleError', relaysError)
      return
    }

    ownProfileStore.updateContactsEvent(event)
  }

  const handleUnfollow = async () => {
    const contacts = ownProfileStore.contactsEvent
    let tags = contacts?.tags || []
    tags = tags.filter(tag => tag[0] === 'p' && tag[1] !== props.pubkeyToFollow)

    const event = prepareContactsEvent(tags)
    if (!event) return

    emit('handleUnfollowed')
    const relays = relayStore.connectedUserWriteRelaysUrls
    const result = await publishEventToRelays(relays, pool, event)

    const isError = result.every((r: any) => r.success === false)
    if (isError) {
      emit('handleFollowed')
      emit('handleError', relaysError)
      return
    }
    
    ownProfileStore.updateContactsEvent(event)
  }

  const prepareContactsEvent = (tags: any) => {
    const privkey = nsecStore.getPrivkeyBytes()
    if (!privkey) return null
    return finalizeEvent({
      kind: EVENT_KIND.FOLLOW_LIST,
      created_at: now(),
      tags,
      content: ''
    }, privkey)
  }
</script>

<template>
  <span v-if="isSubscribed" @click="handleUnfollow" class="follow-btn">
    unfollow
  </span>
  <span v-else @click="handleFollowClick" class="follow-btn">
    follow
  </span>
</template>

<style scoped>
  .follow-btn {
    font-size: 1.1rem;
    border: 1px solid #bbb;
    padding: 1px 10px;
    cursor: pointer;
    border-radius: 2px;
  }
</style>
