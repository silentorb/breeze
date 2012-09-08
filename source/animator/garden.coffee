"use strict"
MetaHub.import_all()
Bloom.import_all()
Breeze.import_all()

Page = window.Page =
  iris_properties:
    "position.x": "double"
    "position.y": "double"
    rotate: "double"
    "scale.x": "double"
    "scale.y": "double"
    "anchor.x": "double"
    "anchor.y": "double"

  history: []
  project: null
  initialize: ->
    Breeze.animator.initialize_more()
    @menu = @create_menu()
    @timeline = Timeline_Panel.create()
    $(".timeline.panel").append @timeline.element
    @timeline.graph.update()
    @keyboard_actions()
    @initialize_project_panel()
    @properties = Properties_Panel.create()
    $(".properties.panel").append @properties.element
    @load_iris "deevee3.svg"

  initialize_project_panel: ->
    @project_panel = Tab_Panel.create()
    $(".project.panel").append @project_panel.element
    scene = Scene_Panel.create()
    scene.title = "Scene"
    emotions = Emotions_Panel.create(Breeze.animator)
    emotions.title = "Emotions"
    @project_panel.connect scene, "child", "parent"
    @project_panel.connect emotions, "child", "parent"
    @project_panel.set_tab scene

  create_canvas: ->
    self = this
    Breeze.animator.items = []
    @canvas.disconnect_all()  if @canvas
    canvas = $("#canvas")
    canvas.empty()
    @canvas = Canvas.create(canvas)
    @connect @canvas, "child", "parent"
    @canvas.iris.layers[0].setAttribute "transform", "scale(0.8, 0.8) translate(200, 0)"
    @canvas.iris.layers[1].setAttribute "transform", "scale(0.8, 0.8) translate(200, 0)"

  create_menu: ->
    menu = Menu.create()
    $("body").prepend menu.element
    menu.target = Page
    menu

  keyboard_actions: ->
    $(window).keypress (event) ->
      control = event.metaKey or event.ctrlKey
      used = true
      console.log "charCode: " + event.charCode + ", keyCode: " + event.keyCode
      switch event.charCode
        when 32
          event.preventDefault()
          if Breeze.animator.is_playing
            Breeze.animator.stop()
          else
            Breeze.animator.play Breeze.animator.frame
        when 91
          Page.timeline.graph.goto_previous_key()
          event.preventDefault()
        when 93
          Page.timeline.graph.goto_next_key()
          event.preventDefault()
        when 100
          Page.timeline.graph.delete_selection()
        when 105 # 'i'
          selection = Page.selection()
          for item in selection
            Breeze.animator.add_key item
        when 112
          channels = Breeze.animator.active_channels
          index = channels.indexOf("path")
          if index is -1
            channels.push "path"
          else
            channels.splice index, 1
        when 122 # z
          control
        else
          used = false
      return  if used
      switch event.keyCode
        when 33
          Page.timeline.graph.goto_previous_key()
          event.preventDefault()
        when 34
          Page.timeline.graph.goto_next_key()
          event.preventDefault()
        else
          return
      event.preventDefault()

  load: ->
    Block.source_path = "html"
    blocks = ["emotions", "timeline", "menu", "properties", "scene", "tab-panel", "text-field"]
    Ground.add "block", blocks, Block.load
    
    #    Ground.add('data', ['creatures', 'abilities'], Data.load_resource);
    Ground.fertilize ->
      if window.UNIT_TEST is `undefined`
        Page.initialize()
      else
        run_tests()


  load_iris: (filename) ->
    
    #    filename = 'test.ech';
    self = this
    jQuery.get "projects/" + filename, ((response) ->
      self.create_canvas()
      self.canvas.load response
      self.invoke "load", Page.canvas.iris
      
      #            Breeze.animator.create_emotion();
      #          return;
      jQuery.get "projects/" + "deevee.brz", ((response2) ->
        Breeze.animator.load response2, self.canvas.iris
        Breeze.animator.emotion_selection.connect Breeze.animator.emotions[0], "selected", "selection"
        
        #        var animator = Breeze.animator;
        #        var emotion = Emotion.create();
        #        animator.connect(emotion, 'emotion', 'parent');
        #        emotion.animator = animator;
        #        emotion.active(true);
        #        emotion.load(response2, self.canvas.iris);
        Breeze.animator.value "current_emotion", Breeze.animator.emotions[0]  if Breeze.animator.emotions.length > 0
      ), "json"
    ), "xml"

  new_iris: ->
    @create_canvas()

  save_iris: (filename) ->
    filename = filename or "deevee.brz"
    data =
      data: JSON.stringify(@save_animation())
      filename: filename

    Bloom.post "server/store-iris.php", data, ->


  save_animation: ->
    emotions = []
    animator = Breeze.animator
    result = {}
    for emotion in animator.emotions
      emotions.push emotion.save()
    result.emotions = emotions
    result

  selection: ->
    @get_connections "selected"

$ ->
  MetaHub.metanize Page
  Page.load()

Scene = Meta_Object.sub_class("Scene",
  initialize: ->
    @scene.optimize_getter "children", "child"
)
Project = Meta_Object.sub_class("Project",
  initialize: ->
    @scene = Scene.create()
)
Scene_Item = Flower.sub_class("Scene_Item",
  initialize: ->
    @element = $("<li>" + @seed.element.id + "</li>")
)
Scene_Panel = Tree.sub_class("Scene_Panel",
  block: "scene"
  item_type: Scene_Item
  initialize: ->
    @listen Page, "load", @load
    @make_selectable Page

  load: (iris) ->
    @element.empty()
    @watch_seed "child", iris.root
)
new Block("emotion", "<li></li>")
Emotion_Flower = Flower.sub_class("Emotion_Flower",
  block: "emotion"
  initialize: ->
    self = this
    @element.text @seed.name
    
    #
    #    if (this.seed.active()) {
    #      this.element.addClass('selected');
    #    }
    #    
    #    this.listen(this.seed, 'selected', function(active) {
    #      if (active) {
    #        this.element.addClass('selected');
    #      }
    #      else {
    #        this.element.removeClass('selected');
    #      }
    #    });
    #    
    #    this.click(function() {
    #      if (!this.seed.active()) {
    #        Breeze.animator.value('current_emotion', this.seed, this);
    #      }
    #    });
    #    
    @element.dblclick ->
      Bloom.edit_text self.element, (value) ->
        self.seed.name = value


)
Emotion_List = List.sub_class("Emotion_List",
  block: "list"
  item_type: Emotion_Flower
  initialize: ->
    @make_selectable Breeze.animator.emotion_selection
    @watch_seed "emotion"
)
Emotions_Panel = Flower.sub_class("Emotions_Panel",
  block: "emotions"
  initialize: ->
    self = this
    @list = Emotion_List.create(@seed, @element.find(".item-list"))
    @element.find(".buttons li").click ->
      Breeze.animator.create_emotion()

)
Control_Point = Circle.sub_class("Control_Point",
  cps: []
  initialize: ->
    element = @element
    element.setAttribute "stroke", "black"
    element.setAttribute "stroke-width", "2"
    element.setAttribute "fill", "red"
    @listen this, "connect.parent", @initialize_dragging
    @listen this, "connect.source", ->
      source = @get_connection("source")
      @attr "transform", source.attr("transform")

    @listen Breeze.animator, "update", ->
      @element.setAttribute "cx", @point.x
      @element.setAttribute "cy", @point.y


  initialize_dragging: ->
    self = this
    
    # The canvas deselects all if any clicks reach it.
    @element.addEventListener "click", (event) ->
      event.stopPropagation()

    @drag ((event) ->
      point = Page.canvas.iris.convert_client_point(event.clientX, event.clientY)
      source = self.get_connection("source")
      point = source.convert_to_local(point)
      self.move point.x, point.y
    ), (event) ->
      source = self.get_connection("source")
      Breeze.animator.add_key source, "path"  if Breeze.animator.is_recording


  move: (x, y) ->
    
    #    var offset_x = x - this.point.x;
    #    var offset_y = y - this.point.y;
    @point.x = x
    @point.y = y
    @element.setAttribute "cx", x
    @element.setAttribute "cy", y
    
    #    for (var i = 0; i < this.cps.length; i++) {
    #      var cp = this.cps[i];
    #      cp.move(cp.point.x + offset_x, cp.point.y + offset_y);
    #    }
    @get_connection("source").set_path()
)
Canvas = Flower.sub_class("Canvas",
  initialize: ->
    width = @element.width()
    height = @element.height()
    @iris = Iris.create(@element[0], width, height)
    @listen @iris, "connect.object", @initialize_petal
    @listen Page, "connect.selected", @petal_selected
    @listen Page, "disconnect.selected", @petal_deselected
    @listen this, "disconnect-all", ->
      @iris.disconnect_all()

    @element.click ->
      Page.disconnect_all "selected"


  initialize_petal: (petal) ->
    @listen petal, "click", ->
      Page.disconnect_all "selected"
      Page.connect petal, "selected", "selection"

    petal.initialize_more()

  create_control_point: (petal, point, size) ->
    cp = Control_Point.create(point.x, point.y, size)
    @iris.connect cp, "overlay", "parent"
    petal.connect cp, "overlay", "source"
    cp.point = point
    cp

  load: (data) ->
    @iris.load_data data

  petal_deselected: (petal) ->
    petal.get_connections("overlay").forEach (cp) ->
      cp.disconnect_all()


  petal_selected: (petal) ->
    if petal.points
      for point in petal.points
        cp = @create_control_point(petal, point, 4)
        if point.cps
          for control_point in point.cps
            child = @create_control_point(petal, control_point, 2)
            cp.cps.push child
)
Timeline_Marker = Flower.sub_class("Timeline_Marker",
  initialize: ->
    @element = $("<div class=\"marker\"></div>")

  update_position: ->
    x = @frame * @parent().element.width() / Breeze.animator.duration
    @element.css "margin-left", x

  set_position: (frame) ->
    @frame = frame
    @update_position()
)
Keyframe_Marker = Timeline_Marker.sub_class("Keyframe_Marker",
  keys: []
  initialize: ->
    @drag
      owner: this
      moving: @move_position

    @click @move_position
    @listen this, "connect.selection", ->
      @element.addClass "selected"

    @listen this, "disconnect.selection", ->
      @element.removeClass "selected"


  move_position: (event) ->
    x = event.clientX - @element.parent().offset().left
    x = Math.max(0, x)
    frame = Math.round(x * Breeze.animator.duration / @element.parent().width())
    for key in keys
      key.frame = frame
    @set_position frame
    event.bubbles = false
    event.stopPropagation()
    @parent().selection.disconnect_all()
    @parent().selection.connect this, "selected", "selection"
    Breeze.animator.update()
)
Timeline_Graph = Flower.sub_class("Timeline_Graph",
  initialize: ->
    Breeze.animator.set_frame 30
    @position = @add_marker("current", Breeze.animator.frame)
    @selection = Meta_Object.create()
    @connect @selection, "selection", "parent"
    @listen Breeze.animator, "update", ->
      @position.set_position Breeze.animator.frame

    @listen Page, "connect.selected", @petal_selected
    @listen Page, "disconnect.selected", @petal_deselected
    @click ->
      @selection.disconnect_all "selected"

    @listen Breeze.animator, "change.current_emotion", @update_keyframes
    @listen Breeze.animator, "change.duration", @update_marker_positions

  add_marker: (type, frame) ->
    marker = Timeline_Marker.create()
    marker.element.addClass type
    @connect marker, type, "parent"
    marker.set_position frame  if typeof frame is "number"
    marker

  add_keyframe_marker: (key, target) ->
    marker = @get_keyframe(key.frame)
    marker = Keyframe_Marker.create()  unless marker
    marker.element.addClass "keyframe"
    @connect marker, "keyframe", "parent"
    marker.set_position key.frame
    marker.keys.push key
    @element.append marker.element
    marker.connect target, "source", "timeline_marker"

  change_position: (event) ->
    x = event.clientX - @element.offset().left
    x = Math.max(0, x)
    Breeze.animator.set_frame x * Breeze.animator.duration / @element.width()
    @position.set_position Breeze.animator.frame

  delete_selection: ->
    y = undefined
    selected = @selection.get_connections("selected")
    for marker in markers
      source = marker.get_connection("source")
      y = 0
      while y < marker.keys.length
        source.remove_key marker.keys[y]
        y++
      marker.disconnect_all()
    Breeze.animator.update()

  get_keyframe: (frame) ->
    markers = @get_connections("keyframe")
    x = 0

    for marker in markers
      if markers[x].frame is frame
        return markers[x]    
    null

  goto_previous_key: ->
    frame = Breeze.animator.frame
    markers = @get_connections("keyframe")
    if markers.length is 0 or markers[0].frame > frame
      Breeze.animator.set_frame 0
      return
    marker = markers[0]
    x = 1

    while x < markers.length
      if markers[x].frame >= frame
        break
      else
        marker = markers[x]
      x++
    Breeze.animator.set_frame marker.frame

  goto_next_key: ->
    frame = Breeze.animator.frame
    markers = @get_connections("keyframe")
    if markers.length is 0 or markers[markers.length - 1].frame < frame
      Breeze.animator.set_frame Breeze.animator.duration - 1
      return
    marker = markers[markers.length - 1]
    x = markers.length - 2

    while x >= 0
      if markers[x].frame <= frame
        break
      else
        marker = markers[x]
      x--
    Breeze.animator.set_frame marker.frame

  petal_selected: (petal) ->
    targets = petal.get_connections("animation")
    @listen petal, "add.key", @add_keyframe_marker
    @update_keyframes()

  petal_deselected: (petal) ->
    markers = @get_connections("keyframe")

    for marker in markers.length
      if marker.get_connection("source").seed is petal
        marker.disconnect_all()

  update: ->
    @range = Flower.create(@element.parent().find(".range"))
    @range.click @change_position, this
    @range.drag
      owner: this
      moving: @change_position

    parent = @element.parent()
    parent.append @position.element
    @position.set_position Breeze.animator.frame
    @position.element.height @element.height() + parent.find('.range').height() + 1

  update_keyframes: ->
    emotion = Breeze.animator.current_emotion
    @disconnect_all "keyframe"
    return  unless emotion
    selection = Page.selection()

    for item in selection
      channels = emotion.get_petal_targets item
      for channel in channels

        for key in channel.keys
          @add_keyframe_marker key, channel

  update_marker_positions: ->
    markers = @get_connections("keyframe")
    update_position marker for marker in markers
    @position.set_position Breeze.animator.frame
)

Timeline_Status_Bar = Flower.sub_class("Timeline_Status_Bar",
  initialize: ->
    recording = @element.find(".live")
    recording.click ->
      recording.toggleClass "active"
      Breeze.animator.is_recording = recording.hasClass("active")

    duration = @element.find(".duration input")
    Bloom.bind_input duration, Breeze.animator, "duration", this
    @element.find(".play").click ->
      Breeze.animator.play Breeze.animator.frame

)
Timeline_Panel = Flower.sub_class("Timeline_Panel",
  block: "timeline"
  initialize: ->
    @graph = Timeline_Graph.create(@element.find(".graph"))
    @status_bar = Timeline_Status_Bar.create(@element.find(".status-bar"))
)
Properties_Panel = Editor.sub_class("Properties_Panel",
  block: "properties"
  initialize: ->
    @listen Page, "connect.selected", @petal_selected
    @listen Page, "disconnect.selected", @petal_deselected
    @listen this, "connect.child", @field_added

  field_added: (field) ->
    name = field.seed.name
    if name is "path" or Page.iris_properties[name]
      live = field.element.find(".live")
      live.addClass "active"  unless Breeze.animator.active_channels.indexOf(name) is -1
      live.click ->
        live.toggleClass "active"
        if live.hasClass("active")
          Breeze.animator.active_channels.push name
        else
          Breeze.animator.active_channels.splice name, 1


  petal_selected: (petal) ->
    @set_seed petal, Page.iris_properties

  petal_deselected: ->
    @empty()
)