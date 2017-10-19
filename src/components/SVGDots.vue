<template>
  <div>
    <span class="controls">
      <build-path @click.native.stop="setBuildingMode" v-bind:class="this.mode == BUILD ? 'selected' : ''"/>
      <move @click.native.stop="setMoveMode" v-bind:class="this.mode == MOVE ? 'selected' : ''"/>
      <delete @click.native.stop="setDeleteMode" v-bind:class="this.mode == DELETE ? 'selected' : ''"/>
      <zoom-in @click.native.stop="zoomIn"/>
      <zoom-out @click.native.stop="zoomOut"/>
    </span>
    <svg id="svgMap" width="100%" height="100%" @click="clickSVG" @mousedown="mousedownSVG" @dblclick="resetPathStartingPoint">
      <g id="groupScale" transform="scale(1)">
        <g id="groupMove" transform="translate(0,0)">
          <image xlink:href="/static/Third_Floor_Plan_2016.jpg" />
          <circle v-for="n in nodes" 
            :cx="n.x" :cy="n.y" r="7" :key="'n' + n.id" :nodeId="n.id"
            @click="nodeClick" @mousedown.stop="startDragNode"
            class="circle" :stroke="dotStroke" :fill="dotFill" />
          <line v-for="l in lineLinks" 
                :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" :style="lineStyle" :key="l.id" :linkId="l.id"
                class="line" @click.stop="lineClick"/>
        </g>
      </g>
    </svg>
  </div>
</template>
<script>
import ZoomIn from './icons/ZoomIn'
import ZoomOut from './icons/ZoomOut'
import Delete from './icons/Delete'
import Move from './icons/Move'
import BuildPath from './icons/BuildPath'

const BUILD = 1
const MOVE = 2
const DELETE = 3

export default {
  components: {
    ZoomIn,
    ZoomOut,
    Move,
    BuildPath,
    Delete
  },
  data () {
    return {
      // make the constants available in the template
      BUILD: BUILD,
      MOVE: MOVE,
      DELETE: DELETE,
      background: '/static/Third_Floor_Plan_2016.jpg',
      scale: 1,
      shiftX: 0,
      shiftY: 0,
      nodes: [],            // graphSample.nodes,
      links: [],            // graphSample.links,
      isSplitting: false,
      lastId: -1,           // used to assign id to new nodes
      prevNodeId: -1,       // last node from which a link will be constructed
      dotStroke: 'rgb(107, 107, 144)',    // dot stroke, as appears in the svg
      dotFill: 'rgb(107, 107, 144)',      // dot fill color
      mode: BUILD,          // current mode of the component
      lastMouseX: 0,        // contains the information about the last values
      lastMouseY: 0,        // of the mouse position
      beingDragId: -1,      // who is being dragged
      isDragging: false,    // says if we are currently dragging something
      lineStyle: 'stroke:rgb(107, 107, 144);stroke-width:4',
      isEditing: true
    }
  },
  methods: {
    zoomIn (event) {
      console.log('[INFO] Zooming in')
      const g = document.querySelector('#groupScale')
      const newScale = parseFloat(this.scale) + 0.1
      this.scale = newScale
      g.setAttribute('transform', 'scale(' + newScale + ')')
    },
    zoomOut (event) {
      console.log('[INFO] Zooming out')
      const g = document.querySelector('#groupScale')
      const newScale = parseFloat(this.scale) - 0.1
      this.scale = newScale
      g.setAttribute('transform', 'scale(' + newScale + ')')
    },
    mousedownSVG (event) {
      if (this.mode !== MOVE) {
        return
      }
      // save mouse position for the next movement
      this.lastMouseX = event.offsetX
      this.lastMouseY = event.offsetY
      // now listen globally for mouse movements
      window.addEventListener('mousemove', this.panSVG)
      window.addEventListener('mouseup', this.stopPanSVG)
    },
    panSVG (event) {
      if (this.mode !== MOVE) {
        return
      }
      // get how much we move from the last mouse event
      const dx = event.offsetX - this.lastMouseX
      const dy = event.offsetY - this.lastMouseY
      // save mouse position for the next movement
      this.lastMouseX = event.offsetX
      this.lastMouseY = event.offsetY
      const g = document.querySelector('#groupMove')
      let transform = g.getAttribute('transform')

      // keep aware of future changes
      window.addEventListener('resize', this.resizeSVG)

      const newX = this.shiftX + dx
      const newY = this.shiftY + dy
      transform = 'translate(' + newX + ',' + newY + ')'
      console.log('[DEBUG] moving', transform)
      // save how much did we shift the svg
      this.shiftX = newX
      this.shiftY = newY
      // move the svg
      g.setAttribute('transform', transform)
    },
    resizeSVG (event) {
      console.log('[INFO] Resizing')
      const svg = document.querySelector('#svgMap')
      const viewBox = this.getViewBox(svg)
      svg.setAttribute('viewBox', viewBox)
    },
    getViewBox (svg) {
      const box = svg.getBoundingClientRect()
      return '0 0 ' + box.width + ' ' + box.height
    },
    stopPanSVG (event) {
      if (this.mode !== MOVE) {
        return
      }
      console.log('[DEBUG] stop pan')
      // set the dragging mode
      window.removeEventListener('mousemove', this.panSVG)
      window.removeEventListener('mouseup', this.stopPanSVG)
    },
    setBuildingMode (event) {
      console.log('[INFO] Setting BUILD mode')
      this.prevNodeId = -1
      this.mode = BUILD
    },
    setMoveMode (event) {
      console.log('[INFO] Setting MOVE mode')
      this.mode = MOVE
    },
    setDeleteMode (event) {
      console.log('[INFO] Setting DELETE mode')
      this.mode = DELETE
    },
    lineClick (event) {
      const linkId = event.target.getAttribute('linkId')
      console.log('[INFO] line clicked', linkId)
      switch (this.mode) {
        case DELETE:
          // remove the link from the links list
          this.links = this.links.filter(l => l.from + '-' + l.to !== linkId)
          console.log('[INFO] link deleted', linkId)
          break
        case BUILD:
          // we want to remove the clicked link, create a node
          // and create two new links
          const {from, to} = this.links.filter(l => l.from + '-' + l.to === linkId)[0]
          // remove the link from the links list
          this.links = this.links.filter(l => l.from + '-' + l.to !== linkId)
          // create a new node
          const {id} = this.createNode(event.offsetX, event.offsetY)
          // now create two new links
          this.createLink(from, id)
          this.createLink(id, to)
          console.log('[INFO] Splitting link and adding a new node inbetween')
          this.prevNodeId = id

          break
        default:
          break
      }
    },
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
      // we update the id store
      x /= this.scale
      x -= this.shiftX
      y /= this.scale
      y -= this.shiftY
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
          id: l.from + '-' + l.to,
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
          id: l.from + '-' + l.to,
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
.controls svg {
  margin-left: 20px;
  margin-top: 20px;
  width: 24px;
  opacity: 0.5;
  cursor: pointer;
}
.controls svg:hover {
  opacity: 1;
}
.controls .selected {
  opacity: 1;
}
div{
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
}
#mapBackground img {
  width: 100%;
}
@keyframes zoomIn {
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
.line:hover {
  cursor: pointer;
}
</style>
