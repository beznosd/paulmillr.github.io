<script setup lang="ts">
  import { onBeforeUpdate, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { nip19 } from 'nostr-tools'
  import type { EventExtended, EventTextPart } from './../types'
  import { useNpub } from '@/stores/Npub'
  import { useUser } from '@/stores/User'
  import cloneDeep from 'lodash/cloneDeep'

  interface ContentPart {
    type: string
    value: string
    npub?: string
  }

  const props = defineProps<{
    event: EventExtended
    slice?: boolean
  }>()
  const router = useRouter()
  const npubStore = useNpub()
  const userStore = useUser()

  const contentParts = ref<EventTextPart[]>([])

  const POST_LINES_COUNT = 20
  const POST_TEXT_LENGTH = 500

  onMounted(() => {
    contentParts.value = getContentParts(props.event)
  })

  onBeforeUpdate(() => {
    contentParts.value = getContentParts(props.event)
  })

  const getSortedReferences = (event: EventExtended) => {
    const references = cloneDeep(event.references)
    const { content } = event

    const cachedIndexes: number[] = []
    references.forEach((ref: any) => {
      const { text } = ref
      let index = content.indexOf(text)

      // handle multiple mentions of the same profile
      while (cachedIndexes.includes(index) && index !== -1) {
        index = content.indexOf(text, index + text.length)
      }

      ref.textIndex = index
      cachedIndexes.push(index)
    })

    references.sort((a: any, b: any) => {
      return a.textIndex - b.textIndex
    })

    return references
  }

  const getTextByLines = (text: string) => {
    /*
      Result example for string "Hello\r\nWorld\nGoodbye\rEnd
      ["Hello\r\n", "World\n", "Goodbye\r", "End"]
    */
    return [...text.matchAll(/(.*?(\r\n|\n|\r|\n\r$))/g)].map((match) => match[0])
  }

  const cutTextByLines = (text: string, cutLine: number): string => {
    const lineMatches = getTextByLines(text)
    if (lineMatches.length <= cutLine) {
      return text
    }
    return lineMatches.slice(0, cutLine).join('') + '...'
  }

  const cutTextByLength = (text: string, length: number) => {
    if (text.length <= length) {
      return text
    }
    return text.slice(0, length) + '...'
  }

  const cutTextByLengthAndLines = (text: string, length: number, lines: number) => {
    return cutTextByLength(cutTextByLines(text, lines), length)
  }

  const isTextOutOfShowLimit = (text: string, lengthLimit: number, linesLimit: number) => {
    const textLines = getTextByLines(text)
    return text.length > lengthLimit || textLines.length > linesLimit
  }

  const getCurrentTextLimits = (parts: ContentPart[]) => {
    const contentLength = parts.reduce((acc, part) => acc + part.value.length, 0)
    const contentLines = getTextByLines(parts.map((part) => part.value).join('')).length
    return {
      lengthLimit: POST_TEXT_LENGTH - contentLength,
      linesLimit: POST_LINES_COUNT - contentLines,
    }
  }

  const splitContentByTypedParts = (event: EventExtended) => {
    const parts: ContentPart[] = []
    let maxContentLimitExceeded = false
    let eventRestText = event.content

    getSortedReferences(event).forEach((reference: any) => {
      if (maxContentLimitExceeded) return

      const refIndex = eventRestText.indexOf(reference.text)
      const textPart = eventRestText.slice(0, refIndex)

      const { lengthLimit, linesLimit } = getCurrentTextLimits(parts)
      parts.push({
        type: 'text',
        value: cutTextByLengthAndLines(textPart, lengthLimit, linesLimit),
      })

      if (props.slice && isTextOutOfShowLimit(textPart, lengthLimit, linesLimit)) {
        maxContentLimitExceeded = true
        return
      }

      const name = getReferenceName(reference)
      const npub = getNpub(reference.profile.pubkey)
      parts.push({ type: 'profile', value: name, npub })

      eventRestText = eventRestText.slice(refIndex + reference.text.length)
    })

    if (maxContentLimitExceeded) {
      return parts
    }

    const { lengthLimit, linesLimit } = getCurrentTextLimits(parts)
    parts.push({
      type: 'text',
      value: cutTextByLengthAndLines(eventRestText, lengthLimit, linesLimit),
    })

    return parts
  }

  const getContentParts = (event: EventExtended) => {
    return splitContentByTypedParts(event)
  }

  const getReferenceName = (reference: any) => {
    const details = reference.profile_details
    const npub = getNpub(reference.profile.pubkey)
    const name =
      details.name || details.username || details.display_name || `${npub.slice(0, 15)}...`
    return `@${name}`
  }

  const getNpub = (pubkey: string) => {
    return nip19.npubEncode(pubkey)
  }

  const handleClickMention = (mentionNpub: string | undefined) => {
    if (!mentionNpub) return
    npubStore.updateNpubInput(mentionNpub)
    userStore.updateRoutingStatus(true)
    router.push({ path: `/user/${mentionNpub}` })
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
</template>

<style scoped>
  .event-content {
    white-space: pre-line;
    word-break: break-word;
  }
</style>
