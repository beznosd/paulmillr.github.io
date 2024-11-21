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

  const POST_LINES_COUNT = 15
  const POST_TEXT_LENGTH = 500

  const sliceContent = ref(props.slice ?? true)
  const toggleMore = ref(false)

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

  const getTextLines = (text: string) => text.split(/\n/)

  const cutTextByLine = (text: string, line: number): string => {
    const lines = getTextLines(text)
    if (lines.length <= line) return text
    return lines.slice(0, line).join('\n')
  }

  const cutTextByLength = (text: string, length: number) => {
    if (text.length <= length) {
      return text
    }
    return text.slice(0, length)
  }

  const cutTextByLengthAndLine = (text: string, length: number, lines: number) => {
    return cutTextByLength(cutTextByLine(text, lines), length)
  }

  const isContentReachedLimits = (parts: ContentPart[]) => {
    const contentLength = getPartsContentLength(parts)
    const contentLines = getPartsContentLines(parts)
    return contentLength >= POST_TEXT_LENGTH || contentLines >= POST_LINES_COUNT
  }

  const getPartsContentLength = (parts: ContentPart[]) => {
    return parts.reduce((acc, part) => acc + part.value.length, 0)
  }

  const getPartsContentLines = (parts: ContentPart[]) => {
    if (!parts.length) return 0
    return getTextLines(parts.map((part) => part.value).join('')).length
  }

  const cutPartText = (rawText: string, parts: ContentPart[]) => {
    let lengthLimit = POST_TEXT_LENGTH - getPartsContentLength(parts)
    let linesLimit = POST_LINES_COUNT - getPartsContentLines(parts)
    if (lengthLimit < 0 || linesLimit < 0) return ''
    return cutTextByLengthAndLine(rawText, lengthLimit, linesLimit)
  }

  const splitContentByTypedParts = (event: EventExtended) => {
    const toSlice = sliceContent.value
    const parts: ContentPart[] = []
    let eventRestText = event.content

    try {
      getSortedReferences(event).forEach((reference: any) => {
        const refIndex = eventRestText.indexOf(reference.text)
        const partText = eventRestText.slice(0, refIndex)
        const partValue = toSlice ? cutPartText(partText, parts) : partText

        parts.push({ type: 'text', value: partValue })
        if (toSlice && isContentReachedLimits(parts)) {
          throw new Error('Event content reached length limit')
        }

        const name = getReferenceName(reference)
        const npub = getNpub(reference.profile.pubkey)

        parts.push({ type: 'profile', value: name, npub })
        if (toSlice && isContentReachedLimits(parts)) {
          throw new Error('Event content reached length limit')
        }

        eventRestText = eventRestText.slice(refIndex + reference.text.length)
      })
    } catch (e) {
      parts.push({ type: 'text', value: '...' })
      toggleMore.value = true
      return parts
    }

    // handle the rest of the text after the last reference (user mention)
    const partValue = toSlice ? cutPartText(eventRestText, parts) : eventRestText
    parts.push({ type: 'text', value: partValue })
    if (toSlice && isContentReachedLimits(parts)) {
      parts.push({ type: 'text', value: '...' })
      toggleMore.value = true
    }

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

  const toggleShowMore = () => {
    sliceContent.value = !sliceContent.value
    contentParts.value = getContentParts(props.event)
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
  <div v-if="toggleMore" class="show-more">
    <span @click="toggleShowMore"> Show {{ sliceContent ? 'more' : 'less' }} </span>
  </div>
</template>

<style scoped>
  .event-content {
    white-space: pre-line;
    word-break: break-word;
  }

  .show-more {
    color: #0092bf;
    text-decoration: none;
    cursor: pointer;
  }
</style>
