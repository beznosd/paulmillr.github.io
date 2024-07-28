<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  const items = ref<HTMLDivElement | null>(null)
  const select = ref<HTMLDivElement | null>(null)
  const selected = ref<HTMLSpanElement | null>(null)
  const prevSelected = ref<HTMLLIElement | null>(null)

  const emit = defineEmits(['handleSelect'])

  onMounted(() => {
    prevSelected.value = document.querySelector('.active')
  })

  const handleSelectClick = () => {
    if (!items.value || !select.value) return
    items.value.classList.toggle('open')
  }

  const handleItemClick = (e: Event) => {
    console.log('selected relay')
    if (!items.value || !select.value || !selected.value) return

    const target = e.target as HTMLLIElement
    if (!target.classList.contains('item')) return

    hideList()
    updateSelectedView(target)

    const selectedValue = target.textContent
    emit('handleSelect', selectedValue)
  }

  const updateSelectedView = (target: HTMLLIElement) => {
    if (!selected.value) return
    selected.value.textContent = target.textContent
    if (prevSelected.value) {
      prevSelected.value.classList.remove('active')
    }
    target.classList.add('active')
    prevSelected.value = target
  }

  const hideList = () => {
    if (!items.value) return
    items.value.classList.remove('open')
  }

  // e: FocusEvent
  const handleSelectBlur = () => {
    // setTimeout(() => {
    if (!items.value) return
    items.value.classList.remove('open')
    // }, 100)
  }
</script>

<template>
  <div class="dropdown">
    <button ref="select" @click="handleSelectClick" class="select">
      <span ref="selected" class="selected">wss://nos.lol</span>
      <div class="caret"></div>
    </button>
    <ul ref="items" class="items" @click="handleItemClick">
      <li class="item active">wss://nos.lol</li>
      <li class="item">wss://relay.example.com</li>
      <li class="item">custom url</li>
    </ul>
  </div>
</template>

<style scoped>
  .dropdown {
    position: relative;
  }

  .dropdown * {
    box-sizing: border-box;
  }

  .select {
    width: 100%;
    border: none;
    background: #2a2f3b;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 12px;
    border-radius: 5px;
    color: white;
    transition: background 0.2s;
    cursor: pointer;
  }

  .select:hover {
    background: #323741;
  }

  .caret {
    border: solid white;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(45deg) translateY(-2px);
    margin-bottom: 1px;
  }

  .items {
    position: absolute;
    width: 100%;
    list-style-type: none;
    padding: 7px 7px;
    background: #2a2f3b;
    border-radius: 5px;
    margin: 4px 0 0;
    transition: 0.2s;
    box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.2);
    opacity: 0;
    display: none;
    z-index: 1;
  }

  .items li {
    padding: 3px 10px;
    margin: 3px 0;
    border-radius: 5px;
    cursor: pointer;
  }

  .items li:hover {
    background: #323741;
  }

  .items li.active {
    background: #0092bf;
  }

  .items.open {
    opacity: 1;
    display: block;
  }
</style>
