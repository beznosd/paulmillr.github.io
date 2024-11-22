<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import type { EventExtended, EventTextPart } from '../../types'
  import { useNpub } from '@/stores/Npub'
  import { useUser } from '@/stores/User'
  import {
    splitEventContentByParts,
    getPartsRawContentLength,
  } from '@/components/EventText/EventTextUtils'

  const props = defineProps<{
    event: EventExtended
    slice?: boolean
  }>()
  const router = useRouter()
  const npubStore = useNpub()
  const userStore = useUser()

  const contentParts = ref<EventTextPart[]>([])
  const sliceContent = ref(props.slice ?? true)
  const toggleMore = ref(false)

  onMounted(() => {
    const parts = splitEventContentByParts(props.event, sliceContent.value)
    const partsRawContentLength = getPartsRawContentLength(parts)

    contentParts.value = parts
    if (props.slice && props.event.content.length > partsRawContentLength) {
      toggleMore.value = true
    }
  })

  const handleClickMention = (mentionNpub: string | undefined) => {
    if (!mentionNpub) return
    npubStore.updateNpubInput(mentionNpub)
    userStore.updateRoutingStatus(true)
    router.push({ path: `/user/${mentionNpub}` })
  }

  const toggleShowMore = () => {
    sliceContent.value = !sliceContent.value
    const parts = splitEventContentByParts(props.event, sliceContent.value)
    const partsRawContentLength = getPartsRawContentLength(parts)

    contentParts.value = parts
    if (props.slice && props.event.content.length > partsRawContentLength) {
      toggleMore.value = true
    }
  }
</script>

<template>
  <div class="event-content">
    <span v-for="(part, i) in contentParts" v-bind:key="i">
      <span v-if="part.type === 'text'">
        {{ part.value }}
      </span>
      <span v-if="part.type === 'profile'">
        <a @click.prevent="() => handleClickMention(part.npub)" href="#">
          {{ part.value }}
        </a>
      </span>
    </span>
  </div>
  <div v-if="toggleMore">
    <span class="show-more" @click="toggleShowMore">
      Show {{ sliceContent ? 'more' : 'less' }}
    </span>
  </div>
</template>

<style scoped>
  .event-content {
    white-space: pre-line;
    word-break: break-word;
  }

  .show-more {
    color: #0092bf;
    cursor: pointer;
  }
</style>
