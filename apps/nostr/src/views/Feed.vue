<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { SimplePool, nip10, type Filter, type Event, type SubCloser } from 'nostr-tools'
  import RelayEventsList from './../components/RelayEventsList.vue'
  import Pagination from './../components/Pagination.vue'
  // import RelayLog from './../components/RelayLog.vue'
  import LoadFromFeedSelect from '@/components/LoadFromFeedSelect.vue'
  import MessageInput1 from '@/components/MessageInput1.vue'
  import { DEFAULT_EVENTS_COUNT } from './../app'
  import type { EventExtended, LogContentPart } from './../types'
  import { useRelay } from '@/stores/Relay'
  import { useImages } from '@/stores/Images'
  import { useFeed } from '@/stores/Feed'
  import { usePool } from '@/stores/Pool'
  import { useNsec } from '@/stores/Nsec'
  import { useMetasCache } from '@/stores/MetasCache'
  import ShowImagesCheckbox from '@/components/ShowImagesCheckbox.vue'
  import { getConnectedReadWriteRelays, getFollowsConnectedRelaysMap } from '@/utils/network'
  import { loadAndInjectDataToPosts, listRootEvents } from '@/utils'

  defineProps<{
    eventsLog: LogContentPart[][]
  }>()

  const relayStore = useRelay()
  const imagesStore = useImages()
  const feedStore = useFeed()
  const nsecStore = useNsec()
  const poolStore = usePool()
  const metasCacheStore = useMetasCache()

  const pool = poolStore.pool

  const emit = defineEmits(['loadNewRelayEvents', 'handleRelayConnect'])

  // loading new events
  const newAuthorImg1 = computed(() => feedStore.newEventsBadgeImageUrls[0])
  const newAuthorImg2 = computed(() => feedStore.newEventsBadgeImageUrls[1])

  // pagination
  const currentPage = ref(1)
  const pagesCount = computed(() =>
    Math.ceil(feedStore.paginationEventsIds.length / DEFAULT_EVENTS_COUNT),
  )
  const route = useRoute()
  const currPath = computed(() => route.path)

  // migrated from App.vue
  let newEvents = ref<{ id: string; pubkey: string }[]>([])
  // events in feed
  const eventsIds = new Set()
  const sentEventIds = new Set()

  let relaysSub: SubCloser
  let curInterval: number

  watch(
    () => route.path,
    async () => {
      if (currentPage.value > 1) {
        showFeedPage(1)
      }
    },
  )

  watch(
    () => feedStore.selectedFeedSource,
    async () => {
      if (relayStore.currentRelay.connected && nsecStore.isValidNsecPresented()) {
        console.log(
          'Relay is connected, loading feed from feed..., watch handleRelayConnect true true',
        )
        await emit('handleRelayConnect', true, true)
      }
    },
  )

  watch(
    () => feedStore.isMountAfterLogin,
    async () => {
      if (!feedStore.isMountAfterLogin) return
      console.log('here is mount only after login')
      feedStore.setMountAfterLogin(false)
      mountFeed()
    },
    { immediate: true },
  )

  async function mountFeed() {
    feedStore.setLoadingFeedSourceStatus(true)

    relayStore.setIsConnectingToReadWriteRelaysStatus(true)
    relayStore.setIsConnectedToReadWriteRelaysStatus(false)

    const {
      userConnectedReadRelays,
      userConnectedWriteRelays,
    }: {
      userConnectedReadRelays: string[]
      userConnectedWriteRelays: string[]
    } = await getConnectedReadWriteRelays(relayStore.userReadWriteRelays)

    relayStore.setConnectedUserReadRelayUrls(userConnectedReadRelays)
    relayStore.setConnectedUserWriteRelayUrls(userConnectedWriteRelays)

    relayStore.setIsConnectingToReadWriteRelaysStatus(false)
    relayStore.setIsConnectedToReadWriteRelaysStatus(true)

    // if no user default relays from nsec, use current relay
    let feedRelays = userConnectedReadRelays.length
      ? userConnectedReadRelays
      : [relayStore.currentRelay.url]

    // get follows relays and pubkeys
    let followsRelaysMap: Record<string, string[]> = {}
    const pubkey = nsecStore.getPubkey()
    const folowsRelaysSet = new Set<string>()
    let followsPubkeys: string[] = []
    if (feedStore.isFollowsSource && pubkey.length) {
      const follows = await pool.get(feedRelays, {
        kinds: [3],
        limit: 1,
        authors: [pubkey],
      })
      if (follows) {
        followsPubkeys = follows.tags.map((f) => f[1])
        followsRelaysMap = await getFollowsConnectedRelaysMap(
          follows,
          feedRelays,
          pool as SimplePool,
        )
        for (const relays of Object.values(followsRelaysMap)) {
          relays.forEach((r) => folowsRelaysSet.add(r))
        }
      }
    }

    if (folowsRelaysSet.size) {
      feedRelays = Array.from(folowsRelaysSet)
    }
    relayStore.setConnectedFeedRelayUrls(feedRelays)

    let postsFilter: Filter = { kinds: [1], limit: DEFAULT_EVENTS_COUNT }
    if (followsPubkeys.length) {
      postsFilter.authors = followsPubkeys
    }
    let posts = (await listRootEvents(pool as SimplePool, feedRelays, [postsFilter])) as Event[]
    posts = posts.sort((a, b) => b.created_at - a.created_at)

    // in callback we receive posts one by one with injected data as soon as they were loaded
    // cache with metas also is being filled here inside
    // (all data for all posts is loaded in parallel)
    const isRootPosts = true
    await loadAndInjectDataToPosts(
      posts,
      null,
      followsRelaysMap,
      feedRelays,
      metasCacheStore,
      pool as SimplePool,
      isRootPosts,
      (post) => {
        feedStore.pushToEvents(post as EventExtended)
        if (feedStore.isLoadingFeedSource) {
          feedStore.setLoadingFeedSourceStatus(false)
          feedStore.setLoadingMoreStatus(true)
        }

        eventsIds.add(post.id)
        feedStore.pushToPaginationEventsIds(post.id)
      },
    )
    feedStore.setLoadingMoreStatus(false)

    let subscribePostsFilter: Filter = { kinds: [1], limit: 1 }
    if (followsPubkeys.length) {
      subscribePostsFilter.authors = followsPubkeys
    }
    const subPool = new SimplePool()
    relaysSub = subPool.subscribeMany(feedRelays, [subscribePostsFilter], {
      onevent(event: Event) {
        if (eventsIds.has(event.id)) return
        const nip10Data = nip10.parse(event)
        if (nip10Data.reply || nip10Data.root) return // filter non root events
        newEvents.value.push({ id: event.id, pubkey: event.pubkey })
        feedStore.pushToNewEventsToShow({ id: event.id, pubkey: event.pubkey })
      },
    })
    curInterval = setInterval(updateNewEventsElement, 3000)
  }

  const updateNewEventsElement = async () => {
    const relays = relayStore.connectedFeedRelaysUrls
    if (!relays.length) return

    const eventsToShow = feedStore.newEventsToShow
    if (eventsToShow.length < 2) return

    const pub1 = eventsToShow[eventsToShow.length - 1].pubkey
    const pub2 = eventsToShow[eventsToShow.length - 2].pubkey

    const eventsListOptions1 = { kinds: [0], authors: [pub1], limit: 1 }
    const eventsListOptions2 = { kinds: [0], authors: [pub2], limit: 1 }

    const author1 = await pool.querySync(relays, eventsListOptions1)
    const author2 = await pool.querySync(relays, eventsListOptions2)

    if (!curInterval) return
    if (!author1[0]?.content || !author2[0]?.content) return

    const authorImg1 = JSON.parse(author1[0].content).picture
    const authorImg2 = JSON.parse(author2[0].content).picture

    feedStore.setNewEventsBadgeImageUrls([authorImg1, authorImg2])
    feedStore.setNewEventsBadgeCount(eventsToShow.length)
    feedStore.setShowNewEventsBadge(true)
  }

  onMounted(async () => {
    console.log('mounted feed')

    // feedStore.setShowNewEventsBadge(false)
    // newEvents.value = []
    // feedStore.updateNewEventsToShow([])

    if (pagesCount.value > 1) {
      showFeedPage(1)
    }
  })

  const showFeedPage = async (page: number) => {
    if (feedStore.isLoadingNewEvents) return
    feedStore.setLoadingNewEventsStatus(true)

    const relays = relayStore.connectedFeedRelaysUrls
    if (!relays.length) return

    const limit = DEFAULT_EVENTS_COUNT
    const start = (page - 1) * limit
    const end = start + limit

    const reversedIds = feedStore.paginationEventsIds.slice().reverse()
    const idsToShow = reversedIds.slice(start, end)

    const postsEvents = await pool.querySync(relays, { ids: idsToShow })
    let posts = postsEvents.sort((a, b) => b.created_at - a.created_at)

    const isRootPosts = true
    await loadAndInjectDataToPosts(
      posts,
      null,
      {},
      relays,
      metasCacheStore,
      pool as SimplePool,
      isRootPosts,
    )

    feedStore.updateEvents(posts as EventExtended[])
    feedStore.setLoadingNewEventsStatus(false)
    currentPage.value = page
  }

  const loadNewRelayEvents = async () => {
    await emit('loadNewRelayEvents')
    currentPage.value = 1
  }

  const toggleImages = () => {
    imagesStore.updateShowImages(!imagesStore.showImages)
  }
</script>

<template>
  <div id="feed">
    <MessageInput1 />

    <div class="feed-header">
      <LoadFromFeedSelect />
      <ShowImagesCheckbox :showImages="imagesStore.showImages" @toggleImages="toggleImages" />
    </div>

    <div class="columns">
      <div :class="['events', { events_hidden: currPath === '/log' }]">
        <div v-if="feedStore.isLoadingFeedSource" class="connecting-notice">
          Loading feed from {{ feedStore.selectedFeedSource }}...
        </div>

        <div v-if="feedStore.isLoadingNewEvents" class="connecting-notice">
          Loading new notes...
        </div>

        <div
          v-if="feedStore.showNewEventsBadge"
          @click="loadNewRelayEvents"
          :class="['new-events', { 'new-events_top-shifted': feedStore.isLoadingNewEvents }]"
        >
          <div v-if="imagesStore.showImages" class="new-events__imgs">
            <img class="new-events__img" :src="newAuthorImg1" alt="user's avatar" />
            <img class="new-events__img" :src="newAuthorImg2" alt="user's avatar" />
          </div>
          <span class="new-events__text">{{ feedStore.newEventsBadgeCount }} new notes</span>
          <b class="new-events__arrow">↑</b>
        </div>

        <RelayEventsList
          :events="feedStore.events"
          :pubKey="nsecStore.getPubkey()"
          :showImages="imagesStore.showImages"
          :currentReadRelays="relayStore.connectedFeedRelaysUrls"
          @toggleRawData="feedStore.toggleEventRawData"
        />

        <div v-if="feedStore.isLoadingMore" class="loading-more">Loading more posts...</div>

        <Pagination :pagesCount="pagesCount" :currentPage="currentPage" @showPage="showFeedPage" />
      </div>

      <!-- <div :class="['log-wrapper', { 'log-wrapper_hidden': true }]">
        <RelayLog :eventsLog="eventsLog" />
      </div> -->
    </div>
  </div>
</template>

<style scoped>
  .columns {
    display: flex;
    position: relative;
  }

  .events {
    position: relative;
    flex-grow: 1;
  }

  .events_hidden {
    display: none;
  }

  @media (min-width: 1200px) {
    .events_hidden {
      display: initial;
    }
  }

  .new-events {
    position: absolute;
    z-index: 1;
    padding: 4px 8px;
    top: 17px;
    left: 50%;
    transform: translate(-50%, 0);
    background: #0092bf;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
  }

  .new-events_top-shifted {
    top: 60px;
  }

  @media (min-width: 768px) {
    .new-events {
      padding: 4px 14px;
      width: auto;
    }
  }

  .new-events__img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
  }

  .new-events__text {
    margin-left: 5px;
    margin-right: 5px;
  }

  .new-events__imgs {
    display: flex;
  }
  .new-events__img:first-child {
    margin-right: -10px;
  }

  .log-wrapper {
    flex-grow: 1;
  }

  .log-wrapper_hidden {
    display: none;
  }

  @media (min-width: 1200px) {
    .log-wrapper {
      position: absolute;
      right: -255px;
      width: 240px;
    }

    .log-wrapper_hidden {
      display: initial;
    }
  }

  @media (min-width: 1280px) {
    .log-wrapper {
      right: -265px;
      width: 250px;
    }
  }

  .connecting-notice {
    margin-top: 15px;
  }

  .loading-more {
    text-align: center;
  }

  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
</style>
