<script setup lang="ts">
  import { computed } from 'vue'
  import { useNpub } from '@/stores/Npub'
  const npubStore = useNpub()

  const userTabLink = computed(() =>
    npubStore.cachedUrlNpub.length ? `/user/${npubStore.cachedUrlNpub}` : '/user',
  )
</script>

<template>
  <div class="tabs">
    <router-link class="tab-link" to="/feed">
      <span class="tab-link-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-justify-right"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
          />
        </svg>
        Feed
      </span>
    </router-link>
    <router-link class="tab-link" to="/chat">
      <span class="tab-link-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-chat-dots"
          viewBox="0 0 16 16"
        >
          <path
            d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
          />
          <path
            d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"
          />
        </svg>
        Chat
      </span>
    </router-link>
    <router-link class="tab-link" to="/help">
      <span class="tab-link-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-info-circle"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path
            d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"
          />
        </svg>
        Help
      </span>
    </router-link>
    <router-link class="tab-link" to="/log">
      <span class="tab-link-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-file-earmark-text"
          viewBox="0 0 16 16"
        >
          <path
            d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"
          />
          <path
            d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"
          />
        </svg>
        Log
      </span>
    </router-link>
    <router-link class="tab-link" to="/settings">
      <span class="tab-link-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-gear"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"
          />
          <path
            d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"
          />
        </svg>
        Settings
      </span>
    </router-link>

    <!-- <router-link class="tab-link" to="/feed">Feed</router-link>
    <router-link class="tab-link" :to="userTabLink">User</router-link>
    <router-link class="tab-link" to="/message">Message</router-link>
    <router-link class="tab-link" to="/chat">Chat</router-link>
    <router-link class="tab-link" to="/help">Help</router-link>
    <router-link class="tab-link" to="/log">Log</router-link>
    <router-link class="tab-link" to="/settings">Settings</router-link> -->
  </div>
</template>

<style scoped>
  .tabs {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 412px) {
    .tabs {
      flex-direction: row;
      justify-content: space-between;
    }
  }

  @media (min-width: 510px) {
    .tabs {
      display: block;
    }
  }

  .tab-link {
    display: inline-block;
    /* color: #0092bf; */
    text-decoration: none;
    cursor: pointer;
    padding: 5px 0;
  }

  svg {
    margin-right: 4px;
  }

  .tab-link-text {
    padding: 3px 8px;
    border-radius: 5px;
    display: flex;
    align-items: center;
  }

  @media (min-width: 510px) {
    .tab-link {
      margin-right: 5px;
    }
  }

  .tab-link:hover .tab-link-text {
    /* text-decoration: underline; */
    /* border-bottom: 2px solid #0092bf; */
    /* background-color: #2a2f3b; */
    color: #0092bf;
  }

  .tab-link.router-link-active {
    /* text-decoration: underline; */
    border-bottom: 2px solid #0092bf;
    font-weight: bold;
  }
</style>
