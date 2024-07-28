import { nip10, SimplePool, Relay, utils, type Event, type Filter } from 'nostr-tools'

import { useNsec } from '@/stores/Nsec'
import { useRelay } from '@/stores/Relay'

import { timeout } from '@/utils/helpers'
import { relayGet, parseRelaysNip65 } from '@/utils'

export const connectToSelectedRelay = async (relayUrl: string) => {
  const relayStore = useRelay()
  const nsecStore = useNsec()

  if (relayStore.isConnectingToRelay) return

  if (nsecStore.isNotValidNsecPresented()) {
    return 'Private key is invalid. Please check it and try again.'
  }

  nsecStore.updateCachedNsec(nsecStore.nsec)

  let relay: Relay

  relayStore.setIsConnectingToReadWriteRelaysStatus(true)
  relayStore.setIsConnectedToReadWriteRelaysStatus(false)

  try {
    relayStore.setConnectionToRelayStatus(true)
    // two attempts to connect
    try {
      relay = await Relay.connect(relayUrl)
    } catch (e) {
      await timeout(500)
      relay = await Relay.connect(relayUrl)
    }
  } catch (e) {
    let error = `WebSocket connection to "${relayUrl}" failed. You can try again. `
    if (!navigator.onLine) {
      error += `Or check your internet connection.`
    } else {
      error += `Check WebSocket address. Relay address should be a correct WebSocket URL. Maybe the relay is unavailable or you are offline.`
    }
    relayStore.setConnectionToRelayStatus(false)
    return error
  }

  relayStore.updateCurrentRelay(relay)

  // track log here
  // logHtmlParts([
  //   { type: 'text', value: 'connected to ' },
  //   { type: 'bold', value: relay.url }
  // ])

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

  return 'good'
}

// export const connectFromScratch = async () => {
//   if (relayStore.isConnectingToRelay) return

//   let relayUrl = relayStore.selectInputRelayUrl
//   if (relayUrl === 'custom') {
//     const customUrl = relayStore.selectInputCustomRelayUrl
//     relayUrl = customUrl.length ? utils.normalizeURL(customUrl) : ''
//   }

//   if (!relayUrl.length) return

//   if (nsecStore.isNotValidNsecPresented()) {
//     return 'Private key is invalid. Please check it and try again.';
//   }

//   nsecStore.updateCachedNsec(nsecStore.nsec)

//   let relay: Relay;

//   relayStore.setIsConnectingToReadWriteRelaysStatus(true)
//   relayStore.setIsConnectedToReadWriteRelaysStatus(false)

//   try {
//     relayStore.setConnectionToRelayStatus(true)
//     // two attempts to connect
//     try {
//       relay = await Relay.connect(relayUrl)
//     } catch (e) {
//       await timeout(500)
//       relay = await Relay.connect(relayUrl)
//     }
//   } catch (e) {
//     let error = `WebSocket connection to "${relayUrl}" failed. You can try again. `
//     if (!navigator.onLine) {
//       error += `Or check your internet connection.`
//     } else {
//       error += `Check WebSocket address. Relay address should be a correct WebSocket URL. Maybe the relay is unavailable or you are offline.`
//     }
//     relayStore.setConnectionToRelayStatus(false)
//     return error
//   }

//   relayStore.updateCurrentRelay(relay)

//   // track log here
//   // logHtmlParts([
//   //   { type: 'text', value: 'connected to ' },
//   //   { type: 'bold', value: relay.url }
//   // ])

//   if (nsecStore.isValidNsecPresented()) {
//     const pubkey = nsecStore.getPubkey()
//     const timeout = 3000
//     const authorMeta = await relayGet(relay, [{ kinds: [10002], limit: 1, authors: [pubkey] }], timeout) as Event
//     if (authorMeta && authorMeta.tags.length) {
//       const { read, write } = parseRelaysNip65(authorMeta)
//       relayStore.setReedRelays(read)
//       relayStore.setWriteRelays(write)
//     }
//   }

//   // here we show notice or change view.

//   const userConnectedReadRelays: string[] = []
//   const userConnectedWriteRelays: string[] = []
//   if (relayStore.userReadWriteRelays.length) {
//     const result = await Promise.all(
//       relayStore.userReadWriteRelays.map(async (relay) => {
//         const isConnected = await isWsAvailable(relay.url)
//         return { url: relay.url, connected: isConnected, type: relay.type }
//       })
//     )

//     result.forEach((r) => {
//       // reset pool relays somehow to avoid this check
//       // it is for the case when new url added and the previous handleRelayConnect was not finished yet
//       if (useProvidedRelaysList && !relayStore.reedRelays.includes(r.url)){
//         return
//       }

//       if (r.connected) {
//         userConnectedReadRelays.push(r.url)
//         if (r.type === 'write') {
//           userConnectedWriteRelays.push(r.url)
//         }
//       }

//       // do not show log for the same relay again
//       if (relay?.url === r.url) return
//       const mesasge = r.connected ? 'connected to ' : 'failed to connect to '
//       logHtmlParts([
//         { type: 'text', value: mesasge },
//         { type: 'bold', value: r.url }
//       ])
//     })
//   }

//   relayStore.setConnectedUserReadRelayUrls(userConnectedReadRelays)
//   relayStore.setConnectedUserWriteRelayUrls(userConnectedWriteRelays)
//   relayStore.setIsConnectingToReadWriteRelaysStatus(false)
//   relayStore.setIsConnectedToReadWriteRelaysStatus(true)

//   // if no user default relays from nsec, use current relay
//   let feedRelays = userConnectedReadRelays.length ? userConnectedReadRelays : [relayUrl]

//   const pubkey = nsecStore.getPubkey()
//   const followsRelaysMap: Record<string, string[]> = {}
//   let followsPubkeys: string[] = []
//   if (feedStore.isFollowsSource && nsecStore.isValidNsecPresented()) {
//     const follows = await pool.get(feedRelays, { kinds: [3], limit: 1, authors: [pubkey] })

//     if (follows && follows.tags.length) {
//       followsPubkeys = follows.tags.map(f => f[1])
//       const followsMeta = await pool.querySync(feedRelays, { kinds: [10002], authors: followsPubkeys })
//       const followsRelaysUrlsExceptUserRelays = new Set()

//       followsMeta.forEach((event: Event) => {
//         event.tags.forEach((tag) => {
//           if (tag[0] !== 'r') return
//           const relayUrl = utils.normalizeURL(tag[1])
//           if (feedRelays.includes(relayUrl)) return
//           followsRelaysUrlsExceptUserRelays.add(relayUrl)
//         })
//       })

//       const followsSortedRelays = await Promise.all(
//         Array.from(followsRelaysUrlsExceptUserRelays).map(async (relay: any) => {
//           const isConnected = await isWsAvailable(relay, 1000)
//           return { url: relay, connected: isConnected }
//         })
//       )

//       const isSuccess = followsSortedRelays.some((r: any) => r.connected)
//       if (isSuccess) {
//         logHtmlParts([
//           { type: 'text', value: 'Connected to follows relays' }
//         ])
//       } else {
//         logHtmlParts([
//           { type: 'text', value: 'Failed to connect to follows relays' }
//         ])
//       }

//       const followsConnectedRelaysUrls = followsSortedRelays
//         .filter(r => r.connected)
//         .map(r => r.url)

//       // creating map of relays for each follow (person which user follow)
//       // this map will be used further for loading metas of authors of posts and references inside posts
//       // because laoding from the bunch of all follows relays is too slow,
//       // so we will load only from relays of the author of the post
//       followsMeta.forEach((event: Event) => {
//         const normalizedUrls: string[] = []
//         event.tags.forEach((tag) => {
//           if (tag[0] !== 'r') return
//           const relayUrl = utils.normalizeURL(tag[1])
//           if (followsConnectedRelaysUrls.includes(relayUrl) || feedRelays.includes(relayUrl)) {
//             normalizedUrls.push(relayUrl)
//           }
//         })
//         followsRelaysMap[event.pubkey] = normalizedUrls
//       })

//       feedRelays = [...new Set([...feedRelays, ...followsConnectedRelaysUrls])]
//     }
//   }

//   // HERE WE START LOADING POSTS, EXTRACT TO SEPARETE FUNCTION AND SHOW FEED VIEW

//   let postsFilter: Filter = { kinds: [1], limit: DEFAULT_EVENTS_COUNT }
//   // list follows pubkeys except own, to prevent loading own events in feed
//   followsPubkeys = followsPubkeys.filter(f => f !== pubkey)
//   if (followsPubkeys.length) {
//     postsFilter.authors = followsPubkeys
//   }

//   relayStore.setConnectedFeedRelayUrls(feedRelays)

//   const postsEvents = await listRootEvents(pool as SimplePool, feedRelays, [postsFilter]) as Event[]
//   const posts = postsEvents.sort((a, b) => b.created_at - a.created_at)

//   eventsIds.clear()
//   feedStore.updatePaginationEventsIds([])
//   feedStore.updateEvents([])

//   // in callback we receive posts one by one with injected data as soon as they were loaded
//   // cache with metas also is being filled here inside
//   // (all data for all posts is loaded in parallel)
//   const isRootPosts = true
//   await loadAndInjectDataToPosts(
//     posts,
//     null,
//     followsRelaysMap,
//     feedRelays,
//     metasCacheStore,
//     pool as SimplePool,
//     isRootPosts,
//     (post) => {
//       feedStore.pushToEvents(post as EventExtended)
//       if (feedStore.isLoadingFeedSource) {
//         feedStore.setLoadingFeedSourceStatus(false)
//         feedStore.setLoadingMoreStatus(true)
//       }

//       eventsIds.add(post.id)
//       feedStore.pushToPaginationEventsIds(post.id)
//     }
//   )

//   feedStore.setLoadingMoreStatus(false)
//   relayStore.setConnectionToRelayStatus(false)

//   let subscribePostsFilter: Filter = { kinds: [1], limit: 1 }
//   if (followsPubkeys.length) {
//     subscribePostsFilter.authors = followsPubkeys
//   }
//   const subPool = new SimplePool()
//   relaysSub = subPool.subscribeMany(
//     feedRelays,
//     [subscribePostsFilter],
//     {
//       onevent(event: Event) {
//         if (eventsIds.has(event.id)) return
//         const nip10Data = nip10.parse(event)
//         if (nip10Data.reply || nip10Data.root) return // filter non root events
//         newEvents.value.push({ id: event.id, pubkey: event.pubkey })
//         feedStore.pushToNewEventsToShow({ id: event.id, pubkey: event.pubkey })
//       }
//     }
//   )
//   curInterval = setInterval(updateNewEventsElement, 3000)
// }
