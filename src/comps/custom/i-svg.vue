<template>
  <svg 
    class="i-svg" 
    :class="className"
    :width="size"
    :height="size"
    :style="style"
  >
    <use :xlink:href="iconUrl"></use>
  </svg>
</template>

<script>
export default {
  name: 'iSvg',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    className: {
      type: String,
      default: ''
    },
    style: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    iconUrl() {
      return `#icon-${this.name}`
    }
  }
}
</script>

<style scoped>
.i-svg {
  fill: currentColor;
  vertical-align: middle;
}
</style>