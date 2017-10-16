<template>
  <svg width="100%" height="100%" @click="clickNode" @dblclick="resetPathStartingPoint">
    <circle v-for="n in nodes" :cx="n.x" :cy="n.y" r="10" :key="'n' + n.id" :nodeId="n.id" @click="nodeClick" class="circle" :stroke="dotStroke" :fill="dotFill" />
    <line v-for="l in lineLinks" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" :style="lineStyle" :key="l.x1+l.y1"/>
  </svg>
</template>


<script>

// import graphSample from '../helper/graph-example'

export default {
  data () {
    return {
      nodes: [], // graphSample.nodes,
      links: [], // graphSample.links,
      isSplitting: false,
      lastId: -1, // used to assign id to new nodes
      prevNodeId: -1,
      dotStroke: 'blue',
      dotFill: 'blue',
      lineStyle: 'stroke:rgb(0,0,255);stroke-width:3',
      isEditing: true
    }
  },
  methods: {
    nodeClick (event) {
      const nodeClikedId = parseInt(event.target.getAttribute('nodeId'))
      console.log('[INFO] node clicked', nodeClikedId)
      // here we reset the previous node id such that new path
      // will start from here
      if (this.prevNodeId !== -1) {
        console.log('[INFO] Joining nodes...')
        this.createLink(this.prevNodeId, nodeClikedId)
      }
      this.prevNodeId = nodeClikedId
      this.isSplitting = true
      event.stopPropagation()
    },
    createNode (x, y) {
      // we update the id store
      this.lastId++
      const newNode = {
        id: this.lastId,
        x,
        y
      }
      // adding the new node to nodes list
      this.nodes.push(newNode)
      return newNode
    },
    // adds a new link given the from and to nodes id
    createLink (from, to) {
      this.links.push({from, to})
    },
    clickNode (event) {
      if (!this.isEditing) {
        return
      }
      const newNode = this.createNode(event.offsetX, event.offsetY)
      console.log('[INFO] adding a new node', newNode)

      // if preNode is -1 this means that this node is a starting point
      // so at this time we don't add any link
      if (this.prevNodeId !== -1) {
        this.createLink(this.prevNodeId, newNode.id)
      }

      if (this.isSplitting) {
        // the previous node id was already set
        this.isSplitting = false
      }
      this.prevNodeId = this.lastId
    },
    resetPathStartingPoint (event) {
      console.log('[INFO] reseting starting point of the path')
      this.prevNodeId = -1
    }
  },
  computed: {
    lineLinks () {
      return this.links.map(l => {
        const n1 = this.nodes.filter(n => n.id === l.from)[0]
        const n2 = this.nodes.filter(n => n.id === l.to)[0]
        return {
          x1: n1.x,
          y1: n1.y,
          x2: n2.x,
          y2: n2.y
        }
      })
    }
  },
  watch: {
    links () {
      return this.links.map(l => {
        const n1 = this.nodes.filter(n => n.id === l.from)[0]
        const n2 = this.nodes.filter(n => n.id === l.to)[0]
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

<style scoped>
.circle {
	stroke-width: 1;
	stroke-linecap: round;
}
.circle:hover {
	stroke-width: 20;
  cursor: pointer;
}
</style>
