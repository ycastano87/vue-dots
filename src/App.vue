<template>
  <div id="app">
    <svg-dots/>
  </div>
</template>

<script>
import SVGDots from './components/SVGDots'

export default {
  name: 'app',
  components: {
    'svg-dots': SVGDots
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  height: 90vh;
}
</style>
