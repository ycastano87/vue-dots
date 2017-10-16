<template>
  <svg width="800" height="800">
    <g v-for="n in nodes">
      <circle :cx="n.x" :cy="n.y" r="5" fill="red" />
    </g>
    <g v-for="l in links">
      <line :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" style="stroke:rgb(255,0,0);stroke-width:2" />
    </g>      
  </svg>
</template>


<script>

import graphSample from '../helper/graph-example'

console.log(graphSample)

export default {
  computed: {
    nodes () {
      return graphSample.nodes
    },
    links () {
      return graphSample.links.map(l => {
        const n1 = graphSample.nodes.filter(n => n.id === l.from)[0]
        const n2 = graphSample.nodes.filter(n => n.id === l.to)[0]
        return {
          x1: n1.x,
          y1: n1.y,
          x2: n2.x,
          y2: n2.y
        }
      })
    }
  }

}
</script>
