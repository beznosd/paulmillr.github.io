export const DEFAULT_RELAYS = [
  'wss://nos.lol', // usa
  'wss://relay.damus.io', // cannada
  'wss://relay.nostr.band', // finland
  'wss://relay.nostr.ai', // usa
  'wss://relay.snort.social', // france
]

export const fallbackRelays = [
  'wss://nos.lol',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://relay.nostr.ai',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
  'wss://eden.nostr.land',
  'wss://nostr.wine',
  'wss://offchain.pub',
  'wss://nostr.fmt.wiz.biz',
  'wss://atlas.nostr.land',
  'wss://relay.nostr.bg',
  'wss://relay.mostr.pub',
];

export const DEFAULT_EVENTS_COUNT = 20

export const BECH32_REGEX = /[\x21-\x7E]{1,83}1[023456789acdefghjklmnpqrstuvwxyz]{6,}/
