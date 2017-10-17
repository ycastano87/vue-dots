<template>
  <svg width="100%" height="100%" @click="clickSVG" @dblclick="resetPathStartingPoint">
    <circle v-for="n in nodes" 
      :cx="n.x" :cy="n.y" r="10" :key="'n' + n.id" :nodeId="n.id"
      @click="nodeClick" @mousedown="startDragNode"
      class="circle" :stroke="dotStroke" :fill="dotFill" />
    <line v-for="l in lineLinks" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" :style="lineStyle" :key="l.x1+l.y1"/>
  </svg>
</template>
<script>

const BUILD = 1
const MOVE = 2
const DELETE = 3

export default {
  data () {
    return {
      nodes: [],            // graphSample.nodes,
      links: [],            // graphSample.links,
      isSplitting: false,
      lastId: -1,           // used to assign id to new nodes
      prevNodeId: -1,       // last node from which a link will be constructed
      dotStroke: 'blue',    // dot stroke, as appears in the svg
      dotFill: 'blue',      // dot fill color
      mode: BUILD,          // current mode of the component
      lastMouseX: 0,        // contains the information about the last values
      lastMouseY: 0,        // of the mouse position
      beingDragId: -1,      // who is being dragged
      isDragging: false,    // says if we are currently dragging something
      lineStyle: 'stroke:rgb(0,0,255);stroke-width:3',
      isEditing: true
    }
  },
  methods: {
    startDragNode (event) {
      if (this.mode !== MOVE) {
        return
      }
      // set the on mouse move listener
      window.addEventListener('mousemove', this.moveNode)
      window.addEventListener('mouseup', this.stopDragNode)
      // set the dragging mode
      this.isDragging = true
      // and save the mouse coordinates
      this.lastMouseX = event.offsetX
      this.lastMouseY = event.offsetY
      // set which node is starting to drag
      const nodeId = parseInt(event.target.getAttribute('nodeId'))
      this.beingDragId = nodeId
      console.log('[DEBUG] Starting to drag')
    },
    moveNode (event) {
      if (this.mode !== MOVE || !this.isDragging) {
        return
      }
      // get how much we move from the last mouse event
      const dx = event.offsetX - this.lastMouseX
      const dy = event.offsetY - this.lastMouseY
      // save mouse position for the next movement
      this.lastMouseX = event.offsetX
      this.lastMouseY = event.offsetY
      // move the node
      this.shiftNode(this.beingDragId, dx, dy)
    },
    shiftNode (nodeId, dx, dy) {
      // get the node to shift
      for (let i = 0; i < this.nodes.length; i++) {
        let node = this.nodes[i]
        if (node.id === nodeId) {
          node.x += dx
          node.y += dy
          break
        }
      }
    },
    stopDragNode (event) {
      if (this.mode !== MOVE) {
        return
      }
      // set the dragging mode
      this.isDragging = false
      this.beingDragId = -1
      window.removeEventListener('mousemove', this.moveNode)
      window.removeEventListener('mouseup', this.stopDragNode)
    },
    // called when a node is clicked
    nodeClick (event) {
      const nodeClikedId = parseInt(event.target.getAttribute('nodeId'))
      console.log('[INFO] node clicked', nodeClikedId)
      switch (this.mode) {
        case BUILD:
          this.linkWithLastCreate(nodeClikedId)
          break
        case DELETE:
          this.deleteNode(nodeClikedId)
          break
        default:
          break
      }
      event.stopPropagation()
    },
    // delete a node given its id
    deleteNode (id) {
      console.log('[INFO] delete node', id)
      // remove the node from the node list
      this.nodes = this.nodes.filter(n => n.id !== id)
      // remove the links associated to the node
      this.links = this.links.filter(l => id !== l.from && id !== l.to)
    },
    // join node to the last one
    linkWithLastCreate (nodeClikedId) {
      // here we reset the previous node id such that new path
      // will start from here
      if (this.prevNodeId !== -1) {
        console.log('[INFO] Joining nodes...')
        this.createLink(this.prevNodeId, nodeClikedId)
      }
      this.prevNodeId = nodeClikedId
      this.isSplitting = true
    },
    // create a new node and add it to the node list
    createNode (x, y) {
      // TEST
      if (this.lastId > 4) {
        console.log('[DEBUG] SWITCHING TO MODE DELETE')
        this.mode = DELETE
      }
      // END TEST
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
    clickSVG (event) {
      if (!this.isEditing || this.mode !== BUILD) {
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
@keyframes zoom {
    0%   {stroke-width: 2}
    100% {stroke-width: 20}
}
.circle {
	stroke-width: 1;
	stroke-linecap: round;
}
.circle:hover {
  stroke-width: 16px;
  cursor: pointer;
}
</style>
