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

  const emit = defineEmits(['toggleFollow', 'handleFollowError'])

  const nsecStore = useNsec()
  const relayStore = useRelay()
  const ownProfileStore = useOwnProfile()

  const poolStore = usePool()
  const pool = poolStore.pool

  const props = defineProps<{
    isFollowed: boolean,
    pubkeyToFollow: string,
  }>()

  const loginError = 'Please login to follow the user.'
  const relaysError = 'Something went wrong, please ensure that your write relays are online.'

  const toggleFollow = async () => {
    const ownPubkey = nsecStore.getPubkey()
    if (!ownPubkey) {
      emit('handleFollowError', loginError)
      return
    }

    const { isFollowed } = props
    const contacts = ownProfileStore.contactsEvent
    let tags = contacts?.tags || []

    if (isFollowed)  {
      tags = tags.filter(tag => tag[0] === 'p' && tag[1] !== props.pubkeyToFollow)
    } else {
      tags.push(['p', props.pubkeyToFollow])
    }
    
    const event = prepareContactsEvent(tags)
    if (!event) return

    emit('toggleFollow')
    const relays = relayStore.connectedUserWriteRelaysUrls
    const result = await publishEventToRelays(relays, pool, event)

    const isError = result.every((r: any) => r.success === false)
    if (isError) {
      emit('toggleFollow')
      emit('handleFollowError', relaysError)
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
  <span @click="toggleFollow" class="follow-btn">
    {{ isFollowed ? 'unfollow' : 'follow' }}
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
