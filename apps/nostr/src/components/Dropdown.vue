<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  const items = ref<HTMLDivElement | null>(null)
  const selectBtn = ref<HTMLDivElement | null>(null)
  const selectedTxt = ref<HTMLSpanElement | null>(null)
  const prevSelectedListItem = ref<HTMLLIElement | null>(null)

  const emit = defineEmits(['handleSelect'])
  defineProps<{
    listItems: string[]
  }>()

  onMounted(() => {
    prevSelectedListItem.value = document.querySelector('.active')

    // collapse dropdown on blur
    document.addEventListener('click', (evt) => {
      // if (evt.target === select.value) return
      const target = evt.target as HTMLElement
      const { classList } = target
      if (
        classList.contains('item') ||
        classList.contains('select-button') ||
        classList.contains('items')
      ) {
        return
      }
      hideList()
    })

    // collapse dropdown on escape key
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        hideList()
      }
    })
  })

  const handleSelectClick = () => {
    if (!items.value) return
    items.value.classList.toggle('open')
  }

  const handleItemClick = (e: Event) => {
    if (!items.value || !selectBtn.value || !selectedTxt.value) return

    const target = e.target as HTMLLIElement
    if (!target.classList.contains('item')) return
    updateSelectedView(target)
    hideList()

    const selectedValue = target.dataset.value
    emit('handleSelect', selectedValue)
  }

  const updateSelectedView = (selectedListItem: HTMLLIElement) => {
    if (!selectedTxt.value) return
    selectedTxt.value.textContent = selectedListItem.textContent
    if (prevSelectedListItem.value) {
      prevSelectedListItem.value.classList.remove('active')
    }
    selectedListItem.classList.add('active')
    prevSelectedListItem.value = selectedListItem
  }

  const hideList = () => {
    if (!items.value) return
    items.value.classList.remove('open')
  }
</script>

<template>
  <div class="dropdown">
    <button ref="selectBtn" @click="handleSelectClick" class="select-button">
      <span ref="selectedTxt">{{ listItems[0] }}</span>
      <div class="caret"></div>
    </button>
    <ul ref="items" class="items" @click="handleItemClick">
      <li
        v-for="(item, i) in listItems"
        :key="`item-${i}`"
        :data-value="item"
        :class="['item', { active: i === 0 }]"
      >
        {{ item }}
      </li>
      <li data-value="custom" class="item">Custom relay url</li>
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

  .select-button {
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

  .select-button:hover {
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
