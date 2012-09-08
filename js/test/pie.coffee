MetaHub.import_all()
Bloom.import_all()
Breeze.import_all()

to_rad = 2 * Math.PI / 360
rad = 2 * Math.PI

Segment = Meta_Object.sub_class 'Segment',
  draw: ->
    null
  
Line_Segment = Meta_Object.sub_class 'Line_Segment',
  draw: (point)->
    "L" + point.x + "," + point.y

Arc_Segment = Meta_Object.sub_class 'Arc_Segment',
  radius: new Point(0, 0)
  large_sweep: 0
  initialize: (radius, large_sweep)->
    @radius = radius
    @large_sweep = large_sweep

  draw: (point)->
    "A" + @radius.x + "," + @radius.y + " 0 " + @large_sweep + ",0 " + point.x + "," + point.y

Simple_Path = Petal.sub_class('Simple_Path',
  stroke_width: 3
  stroke: "#333333"
  fill: "red",
  opacity: 1,
  position: new Point(0,0)
  initialize: (slice)->
    @element = Iris.create_element("path")
    @arc = slice
  render: ->
    element = @element
    element.setAttribute "stroke", @stroke
    element.setAttribute "stroke-width", @stroke_width
    element.setAttribute "fill", @fill
    element.setAttribute "opacity", @opacity
    element.setAttribute "stroke-linecap", 'round'
    element.setAttribute "stroke-linejoin", 'round'
    element.setAttribute "transform", 'translate(' + this.position.x + ',' + this.position.y + ')'
    element.setAttribute "d", @path
    
  copy: ->
    result = this.meta_source.create()
    properties = Object.keys(this.meta_source.properties).concat Object.keys(Simple_Path.properties)
    
    for name in properties
      property = this[name]
      if typeof property == 'object'
        result[name] = new Point(property.x, property.y)
      else
        result[name] = property
        
    result.path = @path
    result

  partial_methods: (start, end, inc, source)->
    methods = []
    x = start
    y = 0
    while x != end
      if inc < 0
        methods.push source[@shift_value x, inc, source.length]
      else
        methods.push source[x]
      if y++ > 5
        throw new Error 'Infinite loop!'
      x = @shift_value x, inc, source.length 
    methods

  partial_points: (start, end, inc, source, offset)->
    points = []
    x = start
    y = 0
    while x != end
      point = source[@shift_value x, inc, source.length]
      if offset
        points.push new Point(point.x + offset.x, point.y + offset.y)
      else
        points.push point.copy()
      if y++ > 5
        throw new Error 'Infinite loop!'
      x = @shift_value x, inc, source.length 
    points
     
  render_path: (points, methods)->
    path = 'M' + points[0].x + "," + points[0].y
    x = 0
    while x < points.length
      i = (x + 1) % points.length
      path += ' ' + methods[x].draw points[i]
      x++
    path
    
  shift_value: (value, mod, max)->
    value = (value + mod) % max
    value += max if value < 0
    value
)

#Column_Point_Map = Meta_Object.sub_class('Column_Point_Map',
#  initialize: (arc)->
#    # These points are arranged in the order they are drawn.
#    @points = [ new Point(0, 0), arc.start, arc.end ]
#    @methods = arc.methods.map (f)-> f
#    
#    # Certain pies have an extra point and arc
#    if arc.start_angle < 0.5 && arc.end_angle > 0.5      
#      @points.splice 2, 0, new Point(-arc.radius.x, 0)
#      @methods.splice 2, 0, @methods[1]
#      
#    sides = @points.map (p)-> p.x
#    left = sides.reduce (x, y)-> Math.min(x, y)
#    right = sides.reduce (x, y)-> Math.max(x, y)
#    
#    @start = sides.indexOf right
#    @end = sides.indexOf left
#    @bottom = 0
#    @dir = [ 1, 1 ]
#)

Column = Simple_Path.sub_class('Column',
  path: '',
  height: 100,
  initialize: (arc)->
    @arc = arc
    @height = arc.height
  
  generate: (arc, start, end, dir) ->
    points = arc.points
    @points = [ points[start] ].concat @partial_points start, end, dir, points
    @methods = @partial_methods start, end, dir, arc.methods
    
    @points.push new Point(points[end].x, points[end].y + arc.height)
    @methods.push Line_Segment.create()
    @points = @points.concat @partial_points end, start, dir, points, new Point(0, arc.height) 
    @methods = @methods.concat @partial_methods end, start, dir, arc.methods
    @methods.push Line_Segment.create()

    @path = @render_path(@points, @methods) + 'z'
  
  update: ()->
    @path = @generate @arc, @arc.start, @arc.end, 1
)

Side_Column = Column.sub_class('Side_Column',
  initialize: ()->
    @fill = 'white'
    @opacity = 0.25
    
  update: ()->
    @generate @arc, @arc.start, @shift_value(@arc.start, @dir, @arc.points.length), @dir
)

Slice = Meta_Object.sub_class 'Slice',
  parts: []
  initialize: (position, radius, start, end)->
    @position = position
    @radius = radius
    @value = Meta_Object.value;

    @listen this, 'change.amount', @amount_changed

    @element = Iris.create_element 'g'
  
  amount_changed: (amount, old_amount)->
    if @parent.animating
      @listen @parent, 'animated', ->
        @animate amount, old_amount
    else
      @animate amount, old_amount
      
  animate: (amount, old_amount)->
    amount = parseInt amount
    @parent.animating = true
    span = amount - old_amount
    x = 0
    timer = setInterval =>
      @amount = old_amount + (span * x)
      if x >= 1
        @amount = amount          
        clearInterval timer
        @parent.animating = false
        @parent.invoke 'animated'
      else
        x += 0.1
        @parent.update()
        @parent.render()
    , 10
  
  create_part: (type, color, opacity)->
    part = type.create this
    part.fill = color
    part.opacity = opacity
    @parts.push part
#    iris.connect part, 'child', 'parent'
    @element.appendChild part.element
    part
    
  get_angle_point: (angle)->
    degree = angle * 360
    arc_x = Math.cos(degree * to_rad) * @radius.x
    arc_y = Math.sin(degree * to_rad) * @radius.y

    Point.create(arc_x, -arc_y)
    
    #path = "M" + @center.x + "," + @center.y + " L " + @start.x + "," + @start.y + " A" + @radius.x + "," + @radius.y + " 0 " + @large_sweep + ",0 " + @end.x + "," + @end.y + " z"  

  update: ->
    start = @get_angle_point @start_angle
    end = @get_angle_point @end_angle
           
    if Math.abs(@end_angle - @start_angle) > 0.5
      @large_sweep = 1
    else
      @large_sweep = 0

    @points = [ new Point(0,0), start, end ]
    @methods = [
      Line_Segment.create(),
      Arc_Segment.create(@radius, @large_sweep),
      Line_Segment.create()
    ]
    
    # Certain pies have an extra point and arc
    if @start_angle < 0.5 && @end_angle > 0.5      
      @points.splice 2, 0, new Point(-@radius.x, 0)
      @methods.splice 2, 0, @methods[1]
      
    sides = @points.map (p)-> p.x
    left = sides.reduce (x, y)-> Math.min(x, y)
    right = sides.reduce (x, y)-> Math.max(x, y)
    
    @start = sides.indexOf right
    @end = sides.indexOf left
 
    for part in @parts
      part.update()

  render: ->
    @element.setAttribute "transform", 'translate(' + @position.x + ',' + @position.y + ')'

    for part in @parts
      part.render()

Pie_Top = Simple_Path.sub_class("Pie_Top",
  fill: 'white',
    
  update: ->
    @path = @render_path(@arc.points, @arc.methods) + 'z'
    #@path = 'M0,0 ' + @render_methods.map((f)=> f(points[i++])).join(' ') # + ' z'
)

iris = {}
create_arc = (startx, starty, radiusx, radiusy, endx, endy, positionx, positiony)->
  result = Pie_Top.create()
  result.start = Point.create(startx, starty)
  result.radius = Point.create(radiusx, radiusy)
  result.end = Point.create(endx, endy)
  result.position = Point.create(positionx, positiony)
  result

debug_point = (point, offset, color)->
  color = color || 'white'
  circle = Circle.create(point.x, point.y, 4)
  circle.element.setAttribute 'fill', color
  circle.element.setAttribute 'stroke', 'black'  
  circle.element.setAttribute 'stroke-width', 2
  circle.element.setAttribute "transform", 'translate(' + offset.x + ',' + offset.y + ')'
  iris.debug_layer.appendChild circle.element

debug_points = (points, offset)->
  x = 0
  for point in points
    debug_point point, offset, colors[x++]

add_side_column = (arc, dir, color, opacity)->
  side_column = arc.create_part Side_Column, color, opacity
  side_column.dir = dir

#  iris.connect side_column, 'child', 'parent'

colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

Pie = Meta_Object.sub_class 'Pie',
  position: new Point(400, 300)
  initialize: (items, options)->
    @optimize_getter 'arcs', 'slice'
    @options = options
    y = 0
    radius = 100
    for item in items
      arc = Slice.create @position, new Point(radius, radius * 0.7)
      arc.amount = item.amount
      @connect arc, 'slice', 'parent'
      @create_parts arc, colors[y++], options

  create_parts: (arc, color, options) ->
    arc.bottom = arc.create_part Pie_Top, 'black', 0.6
    add_side_column arc, -1, 'black', 0.6
    arc.create_part Column, color, 0.7
    add_side_column arc, 1, 'white', 0.3
    arc.create_part Pie_Top, 'white', 0.6 

  render: ->
    console.log 'rendering'
    paper = iris.layers[0]
        
    arcs = Array.apply null, @arcs
    arcs.sort (a, b)-> b.middley - a.middley

    for arc in arcs
      if arc.element.parentNode
        paper.removeChild arc.element
        
      paper.appendChild arc.element
      arc.render()

  update: ->
    console.log 'updating'
    total = @arcs.reduce (x, y)-> (x.amount || x) + y.amount
    position = 0
    x = @arcs.length
    for arc in @arcs
      arc.start_angle = position
      arc.end_angle = position += arc.amount / total
      degree = ((arc.end_angle - arc.start_angle) / 2 + arc.start_angle) * 360
      arc.middley = Math.sin(degree * to_rad) * arc.radius.y

    arcs = Array.apply null, @arcs
    arcs.sort (a, b)-> b.middley - a.middley
    
    span = arcs[0].middley - arcs[arcs.length - 1].middley
    console.log span
    for arc in arcs
      #offset = 20 * x--
      offset = (arc.middley * 0.7) + 40
      arc.position = @position.copy()
      arc.position.y -= offset   
      arc.arc_middle = arc.get_angle_point((arc.end_angle - arc.start_angle) / 2 + arc.start_angle)
      arc.position.add new Point(arc.arc_middle.x * @options.gap, arc.arc_middle.y * @options.gap)
      arc.height = 100 + (offset * 0.7)
      arc.bottom.position.y = arc.height
      arc.update()

$ ->
  iris = Iris.create 'content', 800, 600
  iris.debug_layer = Iris.create_element("g")
  iris.element.appendChild iris.debug_layer

  items = []
  items.push
    name: 'Name',
    amount: 20
  items.push
    name: 'Name',
    amount: 15
  items.push
    name: 'Name',
    amount: 20
  items.push
    name: 'Name',
    amount: 40
  items.push
    name: 'Name',
    amount: 17
  items.push
    name: 'Name',
    amount: 20
  
  options =
    gap: 0.07
  
  window.pie = Pie.create items, options
  create_controls pie.arcs
  pie.update()
  pie.render()

Pie_Top_Flower = Flower.sub_class 'Pie_Top_Flower',
  initialize: ->
    @element = $('<div><input type="text"></div>')
    input = @element.find 'input'
    input.val @seed.amount
#    Bloom.bind_input input, @seed, 'amount', this     
    Bloom.watch_input input, =>
      @seed.animate input.val(), @seed.amount
    
create_controls = (arcs)->
  list = List.create $('#controls')
  for arc in arcs
    flower = Pie_Top_Flower.create(arc)
    list.connect flower, 'child', 'parent'
   