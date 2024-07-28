<script setup lang="ts">
  import { ref } from 'vue'
  import { connectToSelectedRelay } from '@/utils/network'
  import Dropdown from '@/components/Dropdown.vue'
  import { utils } from 'nostr-tools'
  import { DEFAULT_RELAY } from '@/app'
  import { useRouter } from 'vue-router'

  import { useNsec } from '@/stores/Nsec'
  import { useRelay } from '@/stores/Relay'

  const relayStore = useRelay()
  const nsecStore = useNsec()

  // const result = await connectToSelectedRelay()
  // console.log('result:', result)

  const router = useRouter()

  const selectedRelay = ref<string>(DEFAULT_RELAY)

  const handleSelect = (selected: string) => {
    selectedRelay.value = selected
  }

  const handleConnectClick = async () => {
    let relayUrl = selectedRelay.value

    // if (relayUrl === 'custom') {
    //   const customUrl = relayStore.selectInputCustomRelayUrl
    //   relayUrl = customUrl.length ? utils.normalizeURL(customUrl) : ''
    // }

    relayUrl = utils.normalizeURL(relayUrl)
    if (!relayUrl.length) {
      console.log('Invalid relay URL')
      return
    }

    // const error = await connectToSelectedRelay(relayUrl)
    // if (error?.length) {
    //   console.log('Error connecting to relay:', error)
    // }

    // console.log('nsecStore.nsec', nsecStore.nsec)
    // console.log('nsecStore.cachedNsec', nsecStore.cachedNsec)
    // console.log('relayStore.currentRelay', relayStore.currentRelay)
    // console.log(
    //   'relaysStrore isConnectingToReadWriteRelays',
    //   relayStore.isConnectingToReadWriteRelays,
    // )
    // console.log(
    //   'relaysStrore isConnectedToReadWriteRelays',
    //   relayStore.isConnectedToReadWriteRelays,
    // )

    router.push({ path: '/feed' })
  }
</script>

<template>
  <div class="fields">
    <div class="field">
      <label class="select-relay-label">
        <strong>Select relay</strong>
      </label>
      <Dropdown @handleSelect="handleSelect" />
    </div>

    <div class="field">
      <label class="select-relay-label" for="priv_key">
        <strong>Login with private key (optional)</strong>
      </label>
      <div class="field-elements">
        <input class="priv-key-input" id="priv_key" type="password" placeholder="nsec..." />
      </div>
    </div>

    <div class="field">
      <button @click="handleConnectClick" class="button button-block">Connect</button>
    </div>
  </div>
</template>

<style scoped>
  .select-relay-label {
    display: inline-block;
    margin-bottom: 5px;
  }

  .fields {
    width: 50%;
    margin: 2rem auto;
  }

  .field {
    margin-top: 15px;
    width: 100%;
  }

  .field-elements {
    overflow: hidden;
  }

  .priv-key-input {
    background: transparent;
    color: inherit;
    border: 1px solid #2a2f3b;
    outline: none;
    border-radius: 5px;
    padding: 6px 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .priv-key-input:focus {
    border: 1px solid #0092bf;
  }

  .button {
    background: #0092bf;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
  }

  .button:hover {
    background: #0077a3;
  }

  .button-block {
    display: block;
  }
</style>
