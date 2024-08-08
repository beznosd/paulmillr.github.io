<script setup lang="ts">
  import { ref, defineEmits } from 'vue'
  import { finalizeEvent } from 'nostr-tools'
  import { useNsec } from '@/stores/Nsec'
  import { useFeed } from '@/stores/Feed'

  const props = defineProps<{
    sentEventIds: Set<string>
    isSendingMessage: boolean
    broadcastNotice: string
  }>()

  const emit = defineEmits(['broadcastEvent'])

  const nsecStore = useNsec()
  const feedStore = useFeed()

  const text = ref('')
  const rows = ref(3)
  const msgErr = ref('')
  const isFocused = ref(false)

  const handleSendMessage = async () => {
    const nsecValue = nsecStore.nsec ? nsecStore.nsec.trim() : ''
    if (!nsecValue.length) {
      msgErr.value = 'Please provide your private key or generate random key.'
      return
    }

    const messageValue = feedStore.messageToBroadcast.trim()
    if (!messageValue.length) {
      msgErr.value = 'Please provide message to broadcast.'
      return
    }

    let privkey: Uint8Array | null
    let pubkey: string
    try {
      privkey = nsecStore.getPrivkeyBytes()
      if (!privkey) {
        throw new Error()
      }
      pubkey = nsecStore.getPubkey()
      if (!pubkey.length) {
        throw new Error()
      }
    } catch (e) {
      msgErr.value = `Invalid private key. Please check it and try again.`
      return
    }

    const event = {
      kind: 1,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      content: messageValue,
      tags: [],
      id: '',
      sig: '',
    }
    const signedEvent = finalizeEvent(event, privkey)

    if (props.sentEventIds.has(signedEvent.id)) {
      msgErr.value = "The same event can't be sent twice (same id, signature)."
      return
    }

    msgErr.value = ''

    emit('broadcastEvent', signedEvent, 'text')
  }

  const handleInput = () => {
    // if (!text.value.length) return
    feedStore.updateMessageToBroadcast(text.value)
    let lines = text.value.split('\n').length
    if (lines < 3) lines = 3
    rows.value = lines
  }
</script>

<template>
  <div class="message-field-wrapper">
    <div :class="['message-field', { active: isFocused }]">
      <textarea
        class="message-input"
        name="message"
        id="message"
        :rows="rows"
        v-model="text"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        placeholder="What do you want to say?"
      ></textarea>
      <div class="message-footer">
        <button class="send-presigned-btn">
          <i class="bi bi-braces icon"></i>
          <span>Send presigned message</span>
        </button>
        <button :disabled="isSendingMessage" class="send-btn" @click="handleSendMessage">
          {{ isSendingMessage ? 'Posting...' : 'Post' }}
        </button>
      </div>
    </div>
    <div class="error">
      {{ msgErr }}
    </div>
    <div class="notice">
      {{ broadcastNotice }}
    </div>
  </div>
</template>

<style scoped>
  .message-field-wrapper {
    margin-bottom: 30px;
  }

  .message-field {
    border: 1px solid #2a2f3b;
    border-radius: 5px;
  }

  .message-field.active {
    border: 1px solid #0092bf;
  }

  .message-input {
    font-size: 16px;
    padding: 10px 12px;
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    /* border: 1px solid #2a2f3b; */
    border: none;
    font-size: 18px;
    color: inherit;
    outline: none;
    line-height: 1.3;
    resize: none;
    display: block;
    border-bottom: none;
  }

  .message-input:focus {
    /* border: 1px solid #0092bf; */
    border-bottom: none;
  }

  .message-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #2a2f3b;
    padding: 12px;
  }

  .send-presigned-btn {
    display: flex;
    align-items: center;
    font-size: 14px;
    cursor: pointer;
    background: transparent;
    border: none;
    outline: none;
    color: #0092bf;
    font-weight: bold;
    padding: 0;
  }

  .send-presigned-btn .icon {
    font-size: 16px;
    margin-right: 3px;
  }

  .send-btn {
    cursor: pointer;
    background: #0092bf;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
  }

  .send-btn:hover {
    background: #0077a3;
  }

  @media (min-width: 768px) {
    .send-btn {
      width: auto;
    }
  }

  .error {
    color: red;
    font-size: 16px;
    margin-top: 5px;
  }

  .notice {
    font-size: 16px;
    margin-top: 5px;
  }
</style>
