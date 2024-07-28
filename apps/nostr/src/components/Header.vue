<script setup lang="ts">
  import { ref } from 'vue'
  import MainMenu from '@/components/MainMenu.vue'

  const isFocused = ref(false)
</script>

<template>
  <div class="header">
    <div class="menu">
      <MainMenu />
      <div class="username">@username</div>
    </div>
    <div class="search">
      <div :class="['search-field', { active: isFocused }]">
        <i class="bi bi-search search-icon"></i>
        <input
          @focus="isFocused = true"
          @blur="isFocused = false"
          :class="['search-input', { active: isFocused }]"
          type="text"
          placeholder="Search nostr..."
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .header {
    margin-top: 15px;
  }

  .menu {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .username:hover {
    cursor: pointer;
    color: #0092bf;
  }

  .search {
    width: 100%;
    margin-top: 10px;
    margin-bottom: 15px;
    text-align: right;
  }

  .search-field {
    display: inline-block;
    width: 30%;
    position: relative;
  }

  .search-field.active {
    display: block;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    left: 10px;
    transform: translateY(-50%);
    color: #2a2f3b;
  }

  .search-input {
    background: transparent;
    color: inherit;
    border: 1px solid #2a2f3b;
    outline: none;
    border-radius: 5px;
    padding: 6px 12px 6px 35px;
    width: 30%;
    box-sizing: border-box;
    width: 100%;
    font-size: 16px;
    /* transition: width 0.2s; */
  }

  .search-input:focus {
    border: 1px solid #0092bf;
  }
</style>
