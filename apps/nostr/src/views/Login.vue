<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { connectToSelectedRelay } from '@/utils/network'
  import Dropdown from '@/components/Dropdown.vue'
  // import ShowImagesCheckbox from '@/components/ShowImagesCheckbox.vue'
  import { utils, Relay, type Event } from 'nostr-tools'
  import { DEFAULT_RELAY, DEFAULT_RELAYS } from '@/app'
  import { useRouter } from 'vue-router'
  import { relayGet, parseRelaysNip65 } from '@/utils'

  import { useNsec } from '@/stores/Nsec'
  import { useRelay } from '@/stores/Relay'
  import { useFeed } from '@/stores/Feed'

  const relayStore = useRelay()
  const nsecStore = useNsec()
  const feedStore = useFeed()

  const router = useRouter()

  const selectedRelay = ref<string>(DEFAULT_RELAY)
  const showCustomRelayUrl = computed(() => selectedRelay.value === 'custom')
  // const showRememberMe = computed(() => nsecStore.isValidNsecPresented())
  const loginError = ref('')

  const handleSelect = (selected: string) => {
    console.log('selected:', selected)
    selectedRelay.value = selected
  }

  const showError = (msg: string) => {
    loginError.value = msg
  }

  const handleConnectClick = async () => {
    let relayUrl = selectedRelay.value
    if (relayUrl === 'custom') {
      const customUrl = relayStore.selectInputCustomRelayUrl
      relayUrl = customUrl.length ? customUrl : ''
    }
    if (!relayUrl.length) {
      return showError('Please provide relay URL or choose one from the list')
    }

    relayUrl = utils.normalizeURL(relayUrl)
    if (!relayUrl.length) {
      return showError('Invalid relay URL')
    }

    console.log('relayUrl:', relayUrl)

    if (relayStore.isConnectingToRelay) return

    if (nsecStore.isNotValidNsecPresented()) {
      return showError('Private key is invalid. Please check it and try again.')
    } else if (nsecStore.isValidNsecPresented()) {
      nsecStore.updateCachedNsec(nsecStore.nsec)
    }

    // return

    let relay: Relay

    relayStore.setConnectionToRelayStatus(true)
    try {
      console.log('test')
      relay = await connectToSelectedRelay(relayUrl)
    } catch (err: any) {
      relayStore.setConnectionToRelayStatus(false)
      return showError(err.message)
    }
    relayStore.updateCurrentRelay(relay)

    if (nsecStore.isValidNsecPresented()) {
      const pubkey = nsecStore.getPubkey()
      const authorMeta = (await relayGet(
        relay,
        [{ kinds: [10002], limit: 1, authors: [pubkey] }],
        3000, // timeout
      )) as Event

      if (!authorMeta) {
        return showError(
          'Your profile was not found on the selected relay. Please check the private key and try again.',
        )
      }

      if (authorMeta.tags.length) {
        const { read, write } = parseRelaysNip65(authorMeta)
        relayStore.setReedRelays(read)
        relayStore.setWriteRelays(write)
      }
    }

    relayStore.setConnectionToRelayStatus(false)
    feedStore.setMountAfterLogin(true)

    router.push({ path: '/feed' })
  }
</script>

<template>
  <div class="fields">
    <div class="field">
      <label class="select-relay-label">
        <strong>Select relay</strong>
      </label>
      <Dropdown :listItems="DEFAULT_RELAYS" @handleSelect="handleSelect" />
    </div>

    <div v-if="showCustomRelayUrl" class="field">
      <div class="field-elements">
        <input
          v-model="relayStore.selectInputCustomRelayUrl"
          class="text-input"
          id="relay_url"
          type="text"
          placeholder="[wss://]relay.example.com"
        />
      </div>
    </div>

    <div class="field">
      <label class="text-input-label" for="priv_key">
        <strong>Login with private key (optional)</strong>
      </label>
      <div class="field-elements">
        <input
          v-model="nsecStore.nsec"
          class="text-input"
          id="priv_key"
          type="password"
          placeholder="nsec..."
        />
      </div>
    </div>
    <!-- <ShowImagesCheckbox
      v-if="showRememberMe"
      :showImages="false"
      @toggleImages="
        () => {
          console.log('test')
        }
      "
    /> -->

    <div class="field">
      <button @click="handleConnectClick" class="button button-block">Connect</button>
    </div>

    <div class="error">{{ loginError }}</div>
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

  .text-input-label {
    display: inline-block;
    margin-bottom: 7px;
  }

  .text-input {
    background: #100f0f !important;
    color: inherit;
    border: 1px solid #2a2f3b;
    outline: none;
    border-radius: 5px;
    padding: 6px 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .text-input:focus {
    border: 1px solid #0092bf;
    background: #100f0f !important;
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

  .error {
    color: red;
    font-size: 16px;
    margin-top: 10px;
  }
</style>
