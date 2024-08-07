<script setup lang="ts">
  import { ref } from 'vue'
  import {
    nip10,
    SimplePool,
    Relay,
    utils,
    type Event,
    type Filter,
    type SubCloser,
  } from 'nostr-tools'
  import { useRouter, useRoute } from 'vue-router'
  import type { EventExtended, LogContentPart, ShortPubkeyEvent } from './types'
  import { isWsAvailable, relayGet, parseRelaysNip65, loadAndInjectDataToPosts } from './utils'
  import { DEFAULT_EVENTS_COUNT } from './app'
  import { publishEventToRelays } from './utils'

  import { useNsec } from '@/stores/Nsec'
  import { useRelay } from '@/stores/Relay'
  import { useFeed } from '@/stores/Feed'
  import { usePool } from '@/stores/Pool'
  import { useMetasCache } from '@/stores/MetasCache'

  const router = useRouter()
  const route = useRoute()
  const nsecStore = useNsec()
  const relayStore = useRelay()
  const feedStore = useFeed()
  const poolStore = usePool()
  const metasCacheStore = useMetasCache()
  const pool = poolStore.pool

  let relaysSub: SubCloser
  let curInterval: number

  const isRemembered = localStorage.getItem('rememberMe') === 'true'
  nsecStore.setRememberMe(isRemembered)
  const initialNsec = isRemembered ? localStorage.getItem('privkey') : ''
  nsecStore.updateNsec(initialNsec || '')

  // events in feed
  const eventsIds = new Set()
  const sentEventIds = new Set()

  let newEvents = ref<{ id: string; pubkey: string }[]>([])

  let newEventsBadgeCount = ref(0)
  let newAuthorImg1 = ref('')
  let newAuthorImg2 = ref('')

  const eventsLog = ref<LogContentPart[][]>([])

  const wsError = ref('')
  const jsonErr = ref('')
  const broadcastNotice = ref('')
  const isSendingMessage = ref(false)

  const logStr = (msg: string) => {
    const parts = [{ type: 'text', value: msg }]
    logHtmlParts(parts)
  }

  const logHtmlParts = (parts: LogContentPart[]) => {
    eventsLog.value.unshift(parts)
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

    newAuthorImg1.value = JSON.parse(author1[0].content).picture
    newAuthorImg2.value = JSON.parse(author2[0].content).picture
    feedStore.setNewEventsBadgeImageUrls([newAuthorImg1.value, newAuthorImg2.value])

    newEventsBadgeCount.value = eventsToShow.length
    feedStore.setNewEventsBadgeCount(eventsToShow.length)

    feedStore.setShowNewEventsBadge(true)
  }

  const timeout = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const listRootEvents = (pool: SimplePool, relays: string[], filters: Filter[]) => {
    return new Promise((resolve) => {
      const events: Event[] = []
      let filtersLimit: number | undefined
      let newFilters = filters
      if (filters && filters.length && filters[0].limit) {
        let { limit, ...restFilters } = filters[0]
        newFilters = [restFilters]
        filtersLimit = limit
      }

      let subClosed = false
      const sub = pool.subscribeMany(relays, newFilters, {
        onevent(event: Event) {
          if (subClosed) return

          const nip10Data = nip10.parse(event)
          if (nip10Data.reply || nip10Data.root) return

          events.push(event)
          if (filtersLimit && events.length >= filtersLimit) {
            sub.close()
            subClosed = true
            resolve(events.slice(0, filtersLimit))
          }
        },
        oneose() {
          sub.close()
          const result = filtersLimit ? events.slice(0, filtersLimit) : events
          resolve(result)
        },
      })
    })
  }

  // TODO: create separate func handleRelayReconnect instead of using useProvidedRelaysList param
  async function handleRelayConnect(
    useProvidedRelaysList: boolean = false,
    changeFeedSource: boolean = false,
  ) {
    if (relayStore.isConnectingToRelay) return

    let relayUrl = relayStore.selectInputRelayUrl
    if (relayUrl === 'custom') {
      const customUrl = relayStore.selectInputCustomRelayUrl
      relayUrl = customUrl.length ? utils.normalizeURL(customUrl) : ''
    }

    if (!relayUrl.length) return

    if (nsecStore.isNotValidNsecPresented()) {
      wsError.value = 'Private key is invalid. Please check it and try again.'
      return
    } else {
      nsecStore.updateCachedNsec(nsecStore.nsec)
    }

    // unsubscribe from previous list of relays and clear interval
    if (!useProvidedRelaysList && relayStore.currentRelay.connected) {
      relayStore.currentRelay.close()
      logHtmlParts([
        { type: 'text', value: 'disconnected from ' },
        { type: 'bold', value: relayStore.currentRelay.url },
      ])
    }

    if (relaysSub) {
      relaysSub.close()
      // TODO: write to log about closing to previous relays from pool
    }
    if (curInterval) {
      clearInterval(curInterval)
      curInterval = 0
    }
    if (!useProvidedRelaysList) {
      relayStore.setReedRelays([])
      relayStore.setWriteRelays([])
    }

    let relay: Relay

    relayStore.setIsConnectingToReadWriteRelaysStatus(true)
    relayStore.setIsConnectedToReadWriteRelaysStatus(false)

    if (!useProvidedRelaysList) {
      try {
        relayStore.setConnectionToRelayStatus(true)
        feedStore.setLoadingFeedSourceStatus(true)
        // two attempts to connect
        try {
          relay = await Relay.connect(relayUrl)
        } catch (e) {
          await timeout(500)
          relay = await Relay.connect(relayUrl)
        }
        wsError.value = ''
      } catch (e) {
        let error = `WebSocket connection to "${relayUrl}" failed. You can try again. `
        if (!navigator.onLine) {
          error += `Or check your internet connection.`
        } else {
          error += `Also check WebSocket address. Relay address should be a correct WebSocket URL. Or relay is unavailable or you are offline.`
        }
        wsError.value = error
        relayStore.setConnectionToRelayStatus(false)
        return
      }

      relayStore.updateCurrentRelay(relay)

      logHtmlParts([
        { type: 'text', value: 'connected to ' },
        { type: 'bold', value: relay.url },
      ])

      // get user default relays if exists
      if (nsecStore.isNotValidNsecPresented()) {
        wsError.value = 'Private key is invalid. Please check it and try again.'
      }

      if (nsecStore.isValidNsecPresented()) {
        const pubkey = nsecStore.getPubkey()
        const timeout = 3000
        const authorMeta = (await relayGet(
          relay,
          [{ kinds: [10002], limit: 1, authors: [pubkey] }],
          timeout,
        )) as Event
        if (authorMeta && authorMeta.tags.length) {
          const { read, write } = parseRelaysNip65(authorMeta)
          relayStore.setReedRelays(read)
          relayStore.setWriteRelays(write)
        }
      }
    }

    // temp
    // userReadRelays = ['wss://nos.lol', 'wss://relay.nostr123.ai']

    // hide new events element and clear it's values
    feedStore.setShowNewEventsBadge(false)
    newEvents.value = []
    feedStore.updateNewEventsToShow([])

    if (changeFeedSource || useProvidedRelaysList) {
      feedStore.setLoadingFeedSourceStatus(true)
    }

    // return
    const userConnectedReadRelays: string[] = []
    const userConnectedWriteRelays: string[] = []
    if (relayStore.userReadWriteRelays.length) {
      const result = await Promise.all(
        relayStore.userReadWriteRelays.map(async (relay) => {
          const isConnected = await isWsAvailable(relay.url)
          return { url: relay.url, connected: isConnected, type: relay.type }
        }),
      )

      result.forEach((r) => {
        // reset pool relays somehow to avoid this check
        // it is for the case when new url added and the previous handleRelayConnect was not finished yet
        if (useProvidedRelaysList && !relayStore.reedRelays.includes(r.url)) {
          return
        }

        if (r.connected) {
          userConnectedReadRelays.push(r.url)
          if (r.type === 'write') {
            userConnectedWriteRelays.push(r.url)
          }
        }

        // do not show log for the same relay again
        if (relay?.url === r.url) return
        const mesasge = r.connected ? 'connected to ' : 'failed to connect to '
        logHtmlParts([
          { type: 'text', value: mesasge },
          { type: 'bold', value: r.url },
        ])
      })
    }

    relayStore.setConnectedUserReadRelayUrls(userConnectedReadRelays)
    relayStore.setConnectedUserWriteRelayUrls(userConnectedWriteRelays)
    relayStore.setIsConnectingToReadWriteRelaysStatus(false)
    relayStore.setIsConnectedToReadWriteRelaysStatus(true)

    // if no user default relays from nsec, use current relay
    let feedRelays = userConnectedReadRelays.length ? userConnectedReadRelays : [relayUrl]

    const pubkey = nsecStore.getPubkey()
    const followsRelaysMap: Record<string, string[]> = {}
    let followsPubkeys: string[] = []
    if (feedStore.isFollowsSource && nsecStore.isValidNsecPresented()) {
      const follows = await pool.get(feedRelays, { kinds: [3], limit: 1, authors: [pubkey] })

      if (follows && follows.tags.length) {
        followsPubkeys = follows.tags.map((f) => f[1])
        const followsMeta = await pool.querySync(feedRelays, {
          kinds: [10002],
          authors: followsPubkeys,
        })
        const followsRelaysUrlsExceptUserRelays = new Set()

        followsMeta.forEach((event: Event) => {
          event.tags.forEach((tag) => {
            if (tag[0] !== 'r') return
            const relayUrl = utils.normalizeURL(tag[1])
            if (feedRelays.includes(relayUrl)) return
            followsRelaysUrlsExceptUserRelays.add(relayUrl)
          })
        })

        const followsSortedRelays = await Promise.all(
          Array.from(followsRelaysUrlsExceptUserRelays).map(async (relay: any) => {
            const isConnected = await isWsAvailable(relay, 1000)
            return { url: relay, connected: isConnected }
          }),
        )

        const isSuccess = followsSortedRelays.some((r: any) => r.connected)
        if (isSuccess) {
          logHtmlParts([{ type: 'text', value: 'Connected to follows relays' }])
        } else {
          logHtmlParts([{ type: 'text', value: 'Failed to connect to follows relays' }])
        }

        const followsConnectedRelaysUrls = followsSortedRelays
          .filter((r) => r.connected)
          .map((r) => r.url)

        // creating map of relays for each follow (person which user follow)
        // this map will be used further for loading metas of authors of posts and references inside posts
        // because laoding from the bunch of all follows relays is too slow,
        // so we will load only from relays of the author of the post
        followsMeta.forEach((event: Event) => {
          const normalizedUrls: string[] = []
          event.tags.forEach((tag) => {
            if (tag[0] !== 'r') return
            const relayUrl = utils.normalizeURL(tag[1])
            if (followsConnectedRelaysUrls.includes(relayUrl) || feedRelays.includes(relayUrl)) {
              normalizedUrls.push(relayUrl)
            }
          })
          followsRelaysMap[event.pubkey] = normalizedUrls
        })

        feedRelays = [...new Set([...feedRelays, ...followsConnectedRelaysUrls])]
      }
    }

    let postsFilter: Filter = { kinds: [1], limit: DEFAULT_EVENTS_COUNT }
    // list follows pubkeys except own, to prevent loading own events in feed
    followsPubkeys = followsPubkeys.filter((f) => f !== pubkey)
    if (followsPubkeys.length) {
      postsFilter.authors = followsPubkeys
    }

    relayStore.setConnectedFeedRelayUrls(feedRelays)

    const postsEvents = (await listRootEvents(pool as SimplePool, feedRelays, [
      postsFilter,
    ])) as Event[]
    const posts = postsEvents.sort((a, b) => b.created_at - a.created_at)

    eventsIds.clear()
    feedStore.updatePaginationEventsIds([])
    feedStore.updateEvents([])

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
    relayStore.setConnectionToRelayStatus(false)

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

  const loadNewRelayEvents = async () => {
    if (feedStore.isLoadingNewEvents) return
    feedStore.setLoadingNewEventsStatus(true)

    const relays = relayStore.connectedFeedRelaysUrls
    if (!relays.length) return

    router.push({ path: `${route.path}` })

    let eventsToShow = feedStore.newEventsToShow
    feedStore.updateNewEventsToShow(
      feedStore.newEventsToShow.filter((item: ShortPubkeyEvent) => !eventsToShow.includes(item)),
    )

    const ids = eventsToShow.map((e: ShortPubkeyEvent) => e.id)
    const limit = DEFAULT_EVENTS_COUNT

    feedStore.updatePaginationEventsIds(feedStore.paginationEventsIds.concat(ids))
    const firstPageIds = feedStore.paginationEventsIds.slice(-limit)

    const postsEvents = await pool.querySync(relays, { ids: firstPageIds })
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
      (post) => eventsIds.add(post.id),
    )

    // update view
    feedStore.updateEvents(posts as EventExtended[])
    feedStore.setShowNewEventsBadge(false)
    feedStore.setLoadingNewEventsStatus(false)

    logHtmlParts([
      { type: 'text', value: `loaded ${eventsToShow.length}` },
      { type: 'text', value: ' new event(s) from ' },
      { type: 'bold', value: relayStore.connectedFeedRelaysPrettyStr },
    ])
  }

  const broadcastEvent = async (event: Event, type: string) => {
    let writeRelays = relayStore.writeRelays

    // for debugging json events
    // if (type !== 'json') {
    //   console.log(JSON.stringify(event))
    //   return
    // }

    if (type === 'json') {
      const rawAdditionalUrls = relayStore.additionalRelaysUrlsForSignedEvent
      let connectedJsonRelays: string[] = []

      if (rawAdditionalUrls.length) {
        let error = "Can't connect to these relays: "
        let isError = false
        for (const url of rawAdditionalUrls) {
          if (!url?.length) continue
          if (!(await isWsAvailable(url))) {
            isError = true
            error += `${url}, `
            continue
          }
          connectedJsonRelays.push(url)
        }

        const connectedRelayUrl = relayStore.currentRelay.url
        if (!(await isWsAvailable(connectedRelayUrl))) {
          isError = true
          error += `${connectedRelayUrl}`
        }

        if (isError) {
          error += `. Relays are unavailable or you are offline.`
          jsonErr.value = error
          isSendingMessage.value = false
          return
        }
      }

      writeRelays = [relayStore.currentRelay.url, ...connectedJsonRelays]
      writeRelays = [...new Set(writeRelays)] // make unique
    }

    if (isSendingMessage.value) return
    isSendingMessage.value = true

    const relaysToWatch = relayStore.connectedUserReadRelayUrls
    let userSub: SubCloser | null = null
    if (relaysToWatch.length) {
      const userNewEventOptions = [{ kinds: [1], ids: [event.id], limit: 1 }]
      userSub = pool.subscribeMany(relaysToWatch, userNewEventOptions, {
        async onevent(event: Event) {
          // update feed only if new event is loaded
          // interval needed because of delay between publishing and loading new event
          const interval = setInterval(async () => {
            if (newEvents.value.some((e) => e.id == event.id)) {
              clearInterval(interval)
              await loadNewRelayEvents()
              userSub?.close()
            }
          }, 100)
        },
      })
    }

    const result = await publishEventToRelays(writeRelays, pool, event)
    result.forEach((data: any) => {
      if (data.success) {
        logHtmlParts([
          { type: 'text', value: '✅ new event broadcasted to ' },
          { type: 'bold', value: data.relay },
        ])
      } else {
        logHtmlParts([
          { type: 'text', value: '❌ failed to publish to ' },
          { type: 'bold', value: data.relay },
        ])
      }
    })

    const isAllError = result.every((r: any) => r.success === false)
    if (isAllError && type === 'json' && relaysToWatch.length) {
      userSub?.close()
    }

    const isError = result.some((r: any) => r.success === false)
    if (!isError) {
      // @ts-ignore
      if (type === 'text') {
        feedStore.updateMessageToBroadcast('')
      }
      if (type === 'json') {
        feedStore.updateSignedJson('')
      }
    }

    isSendingMessage.value = false
  }

  const handleRelayDisconnect = () => {
    if (!relayStore.isConnectedToRelay) return

    clearInterval(curInterval)
    feedStore.setShowNewEventsBadge(false)
    newEvents.value = []
    feedStore.updateNewEventsToShow([])

    const relay = relayStore.currentRelay
    relay.close()
    relaysSub?.close()
    // pool.close(relayStore.userReadWriteRelaysUrls)

    relayStore.clear()

    logHtmlParts([
      { type: 'text', value: 'disconnected from ' },
      { type: 'bold', value: relay.url },
    ])
  }
</script>

<template>
  <router-view
    name="HeaderFields"
    @relayConnect="handleRelayConnect"
    @relayDisconnect="handleRelayDisconnect"
    :wsError="wsError"
  ></router-view>

  <router-view name="Header"></router-view>

  <router-view
    name="messageInput"
    @broadcastEvent="broadcastEvent"
    :isSendingMessage="isSendingMessage"
    :sentEventIds="sentEventIds"
    :broadcastNotice="broadcastNotice"
  ></router-view>
  <router-view
    name="signedEventInput"
    @broadcastEvent="broadcastEvent"
    :isSendingMessage="isSendingMessage"
    :broadcastError="jsonErr"
  ></router-view>
  <router-view name="Hello"></router-view>
  <router-view name="Test1"></router-view>
  <router-view
    @loadNewRelayEvents="loadNewRelayEvents"
    @handleRelayConnect="handleRelayConnect"
    :handleRelayConnect="handleRelayConnect"
    :eventsLog="eventsLog"
  ></router-view>
</template>
