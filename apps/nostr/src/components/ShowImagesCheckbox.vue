<script setup lang="ts">
  // const props = defineProps<{
  //   showImages: boolean
  // }>()

  // const emit = defineEmits(['toggleImages']);
</script>

<template>
  <!-- <div class="show-images">
    <span class="show-images__field">
      <input @change="emit('toggleImages')" class="show-images__input" type="checkbox" id="show-feed-images" :checked="props.showImages" />
      <label class="show-images__label" for="show-feed-images"> Show avatars</label>
    </span>
    <small> (<router-link :to="{ path: '/help', hash: '#privacy' }">Exposes your IP</router-link>)</small>
  </div> -->

  <div class="wrapper">
    <div class="custom-checkbox">
      <label>
        <input type="checkbox" />
        <span class="checkmark"></span>
        <span class="label-text"> Show avatars </span>
      </label>
    </div>
    <small>
      (<router-link :to="{ path: '/help', hash: '#privacy' }">Exposes your IP</router-link>)
    </small>
  </div>
</template>

<style>
  /* .show-images__input,
  .show-images__label {
    cursor: pointer;
  } */

  .wrapper {
    display: flex;
    align-items: end;
  }

  /* Container for the custom checkbox */
  .custom-checkbox {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    margin-right: 5px;
  }

  /* Hide the default checkbox */
  .custom-checkbox input[type='checkbox'] {
    display: none;
  }

  /* Style the custom checkbox */
  .custom-checkbox .checkmark {
    width: 18px;
    height: 18px;
    background: #2a2f3b;
    border-radius: 5px;
    display: inline-block;
    position: relative;
    margin-right: 5px;
  }

  .custom-checkbox label {
    display: flex;
    align-items: center;
  }

  .custom-checkbox label:hover {
    cursor: pointer;
  }

  /* Indicate hover state for the custom checkbox */
  .custom-checkbox:hover .checkmark {
    background: #323741;
    transition: background 0.2s;
  }

  /* Style the checkmark when checkbox is checked */
  .custom-checkbox input[type='checkbox']:checked + .checkmark {
    background: #0092bf;
    transition: none;
  }

  .custom-checkbox .checkmark:after {
    content: '';
    position: absolute;
    display: none;
  }

  .custom-checkbox input[type='checkbox']:checked + .checkmark:after {
    display: block;
  }

  .custom-checkbox .checkmark:after {
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  small {
    line-height: 1.7;
  }
</style>
