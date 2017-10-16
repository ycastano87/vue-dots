export default {
  nodes: [
    {
      id: 0,
      x: 20,
      y: 30
    }, {
      id: 1,
      x: 60,
      y: 25
    }, {
      id: 2,
      x: 100,
      y: 67
    }
  ],
  links: [
    {
      from: 0,
      to: 1
    }, {
      from: 1,
      to: 2
    }, {
      from: 2,
      to: 0
    }
  ]
}
