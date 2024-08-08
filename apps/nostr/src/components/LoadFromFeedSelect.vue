<script setup lang="ts">
  import { computed } from 'vue'
  import { useNsec } from '@/stores/Nsec'
  import { useFeed } from '@/stores/Feed'

  const nsecStore = useNsec()
  const feedStore = useFeed()

  // const showNotice = computed(() => {
  // return feedStore.selectedFeedSource === 'follows' && !nsecStore.isNsecValidTemp
  // })
</script>

<template>
  <div class="laod-from">
    <!-- <div class="laod-from__title">Load posts from</div> -->
    <!-- <div class="load-from__select-wrapper">
      <select
        v-model="feedStore.selectedFeedSource"
        class="load-from__select"
        name="feed-source"
        id="feed-source-select"
      >
        <option value="network">network</option>
        <option value="follows">follows</option>
      </select>
    </div>
  </div> -->
    <!-- <div v-if="showNotice" class="notice">Please log in to load posts from people you follow.</div> -->
    <div class="feed-source-select">
      <span>Follows </span>
      <span class="caret"></span>
    </div>
  </div>
</template>

<style scoped>
  .feed-source-select {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .caret {
    border: solid white;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(45deg) translateY(-2px);
    margin-bottom: 1px;
    margin-left: 5px;
  }

  .laod-from {
    display: flex;
    align-items: center;
  }

  .laod-from__title {
    margin-right: 7px;
  }

  .load-from__select {
    padding: 0 3px;
    cursor: pointer;
  }

  .notice {
    color: red;
    font-size: 16px;
    margin-top: 5px;
  }
</style>
