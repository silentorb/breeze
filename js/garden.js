"use strict";

MetaHub.import_all(); 
Bloom.import_all();
Breeze.import_all();

var Page = {
  iris_properties: {
    translate_x: 'double',
    translate_y: 'double',
    rotate: 'double',
    scale_x: 'double',
    scale_y: 'double',
    anchor_x: 'double',
    anchor_y: 'double'
  },
  initialize: function() { 
    this.menu = this.create_menu();
    this.timeline = Timeline_Panel.create();
    $('.timeline.panel').append(this.timeline.element);
    this.timeline.graph.update();
    this.keyboard_actions();
    this.initialize_project_panel();
    
    this.properties = Properties_Panel.create();
    $('.properties.panel').append(this.properties.element);
    
    this.load_iris('lines.svg');
  },
  initialize_project_panel: function() {
    this.project_panel = Tab_Panel.create();
    $('.project.panel').append(this.project_panel.element);
    
    var scene = Scene_Panel.create();
    scene.title = "Scene";
    var emotions = Emotions_Panel.create(Breeze.animator);
    emotions.title = "Emotions";
    this.project_panel.connect(scene, 'child', 'parent');
    this.project_panel.connect(emotions, 'child', 'parent');
    this.project_panel.set_tab(emotions);
  },
  create_canvas: function() {
    var self = this;
    Breeze.animator.items = [];
    if (this.canvas) {
      this.canvas.disconnect_all();
    }
    
    var canvas = $('#canvas');
    canvas.empty();  
    this.canvas = Canvas.create(canvas);
    this.connect(this.canvas, 'child', 'parent');
    this.canvas.element.click(function() {
      self.disconnect_all('selected');
    });
  },
  create_menu: function() {
    var menu = Menu.create();
    $('body').prepend(menu.element);
    menu.target = Page;
    return menu;
  },
  keyboard_actions: function() {
    $(window).keypress(function(event) {
      var used = true;
      switch(event.charCode) {
        case 32:
          if (Breeze.animator.is_playing) {
            Breeze.animator.stop();
          }
          else {
            Breeze.animator.play(Breeze.animator.frame);
          }
          break;
        case 100:
          Page.timeline.graph.delete_selection();
          break;
        default:
          used = false;    
      }
      
      if (used)
        return;
      
      switch(event.keyCode) {      
        case 33:
          Page.timeline.graph.goto_previous_key();
          event.preventDefault();
          break;
        case 34:
          Page.timeline.graph.goto_next_key();
          event.preventDefault();
          break;
        default:
          return;
      }
      
      event.preventDefault();
    });
  },
  load: function() {
    Block.source_path = "html";

    var blocks = [
    'emotions',
    'timeline',
    'menu',
    'properties',
    'scene',
    'tab-panel'
    ];

    Ground.add('block', blocks, Block.load);
    //    Ground.add('data', ['creatures', 'abilities'], Data.load_resource);
    Ground.fertilize(function() {
      if (window.UNIT_TEST == undefined) {
        Page.initialize();
      }
      else {
        run_tests(); 
      }
    });
  },
  load_iris: function(filename) {
    //    filename = 'test.ech';
    var self = this;
    jQuery.get('images/' + filename, function(response) {
      jQuery.get('images/' + 'test3.brz', function(response2) {
        self.create_canvas();
        self.canvas.load(response);
        Breeze.animator.load(response2, self.canvas.iris);
        //        var animator = Breeze.animator;
        //        var emotion = Emotion.create();
        //        animator.connect(emotion, 'emotion', 'parent');
        //        emotion.animator = animator;
        //        emotion.active(true);
        //        emotion.load(response2, self.canvas.iris);
        if (Breeze.animator.emotions.length > 0) {
          Breeze.animator.emotions[0].active(true);      
        }

      }, 'json');
    });
  },
  new_iris: function() {
    this.create_canvas();
  },
  save_iris: function(filename) {
    filename = filename || 'test3.brz';    
    var data = {
      'data': JSON.stringify(this.save_animation()),
      'filename': filename
    };
    Bloom.post('server/store-iris.php', data, function() {
      
      });
  },
  save_animation: function() {
    var x, emotions = [], animator = Breeze.animator;
    var result = {};
    
    for (x = 0; x < animator.emotions.length; x++) {
      emotions.push(animator.emotions[x].save());
    }
    
    result.emotions = emotions;
    return result;
  },
  selection: function() {
    return this.get_connections('selected');
  }
};

$(function () {
  MetaHub.metanize(Page);  
  Page.load();
});

MetaHub.extend(Breeze.animator, {
  add_key: function(seed, property) {
    var emotion = this.current_emotion();
    if (emotion)
      emotion.add_key(seed, property);
  },
  current_emotion: function(emotion) {
    if (emotion === undefined || emotion === this.active_emotions[0])
      return this.active_emotions[0];
    
    for (var x = 0; x < Breeze.animator.active_emotions.length; ++x) {
      this.active_emotions[x].active(false);
    }
    
    emotion.active(true);
    this.update();
    this.invoke('emotion.change', emotion);
    return emotion;
  }  
});

var Selection = Meta_Object.sub_class('Selection', {
  add: function(item) {
    if (this.connection(item))
      return;
    
    this.disconnect_all('selected');    
    this.connect(item, 'selected', 'selection');
  },
  remove: function(item) {
    this.disconnect(item);
  }
});

var Scene_Panel = Flower.sub_class('Scene_Panel', {
  block: 'scene'
});

var Emotion_Flower = Flower.sub_class('Emotion_Flower', {
  initialize: function() {
    var self = this;
    this.element = $('<li>' + this.seed.name + '</li>');
    if (this.seed.active()) {
      this.element.addClass('active');
    }
    
    this.listen(this.seed, 'active', function(active) {
      if (active) {
        this.element.addClass('active');
      }
      else {
        this.element.removeClass('active');
      }
    });
    
    this.click(function() {
      if (!this.seed.active()) {
        Breeze.animator.current_emotion(this.seed);
      }
    });
    
    this.element.dblclick(function() {
      Bloom.edit_text(self.element, function(value) {
        self.seed.name = value;
      }); 
    });
  }
});

var Emotion_List = List.sub_class('Emotion_List', {
  block: 'list',
  item_type: Emotion_Flower,
  initialize: function() {    
    this.watch_seed('emotion');
    
  }
});

var Emotions_Panel = List.sub_class('Emotions_Panel', {
  block: 'emotions',
  initialize: function() {
    var self = this;
    this.list = Emotion_List.create(this.seed, this.element.find('.list'));
    this.element.find('.buttons li').click(function() {
      Breeze.animator.create_emotion(this.seed);
    });       
  }
});

var Control_Point = Circle.sub_class('Control_Point', {
  cps: [],
  initialize: function () {
    var self = this, element = this.element;
    element.setAttribute('stroke', 'black');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('fill', 'red');
    this.listen(this, 'connect.parent', function() {
      this.drag(function(event) { 
        var offset = $(element).parent().offset();
        self.move(event.pageX - offset.left, event.pageY - offset.top );
      }, function() {
        var source = self.get_connection('source');
        Breeze.animator.add_key(source, 'path');
      });
    
    });
  
    this.listen(this, 'connect.source', function() {
      var source = self.get_connection('source');
      this.attr('transform', source.attr('transform'));    
    });
      
    this.listen(Breeze.animator, 'update', function() {
      this.element.setAttribute('cx', this.point.x);
      this.element.setAttribute('cy', this.point.y);    
    });
  },
  move: function(x, y) {
    //    var offset_x = x - this.point.x;
    //    var offset_y = y - this.point.y;
    this.point.x = x;
    this.point.y = y; 
    this.element.setAttribute('cx', x);
    this.element.setAttribute('cy', y);
    
    //    for (var i = 0; i < this.cps.length; i++) {
    //      var cp = this.cps[i];
    //      cp.move(cp.point.x + offset_x, cp.point.y + offset_y);
    //    }
    this.get_connection('source').set_path();
  }
});

MetaHub.extend(Petal.properties, {
  initialize_more: function() {
    var self = this;  

    this.element.onclick = function(event) {
      event.stopPropagation();
      self.invoke('click', event);
    };
  
    this.listen(this, 'change', function(name, value, source) {    
      Breeze.animator.add_key(this, name);
      this.update_transform();
    });
  },
  update_transform: function() {
    var transform = this.generate_transform();
    this.attr('transform', transform);
    var overlay_objects = this.get_connections('overlay');
    for (var x = 0; x < overlay_objects.length; x++) {
      overlay_objects[x].attr('transform', transform);
    }
  }
});

var Canvas = Flower.sub_class('Canvas', {
  initialize: function () {
    
    var width = this.element.width();
    var height = this.element.height();
    this.iris = Iris.create(this.element[0],width, height);
    
    this.listen(this.iris, 'connect.child', this.initialize_petal);      
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);
      
    this.listen(this, 'disconnect-all', function() {
      this.iris.disconnect_all();
    });
  },
  initialize_petal: function (petal) {
    this.listen(petal, 'click', function() {
      Page.connect(petal, 'selected', 'page');
    });
    
    petal.initialize_more();
  },
  create_control_point: function(petal, point, size) {
    var cp = Control_Point.create(point.x, point.y, size);
    this.iris.connect(cp, 'overlay', 'parent');      
    petal.connect(cp, 'overlay', 'source');  
    cp.point = point;
    return cp;
  },
  load: function(data) {
    this.iris.load_data(data);
  },
  petal_deselected: function(petal) {
    petal.get_connections('overlay').forEach(function(cp) {
      cp.disconnect_all();
    });    
  },
  petal_selected: function(petal) {
    for (var x = 0; x < petal.points.length; x++) {
      var point = petal.points[x];
      var cp = this.create_control_point(petal, point, 8);
      
      if (point.cps) {
        for (var y = 0; y < point.cps.length; y++) {
          var child = this.create_control_point(petal, point.cps[y], 6);
          cp.cps.push(child);
        }
      }
    }
  }
});

var Timeline_Marker = Flower.sub_class('Timeline_Marker', {
  initialize: function() {
    this.element = $('<div class="marker"></div>');
  },
  set_position: function(frame) {
    var x = frame * this.parent().element.width() / Breeze.animator.duration;
    this.element.css('margin-left', x);
    this.frame = frame;
  }
});

var Keyframe_Marker = Timeline_Marker.sub_class('Keyframe_Marker', {
  initialize: function() {
    this.drag({
      owner: this,
      moving: this.move_position      
    });
    
    this.click(this.move_position);
    
    this.listen(this, 'connect.selection', function() {
      this.element.addClass('selected');
    });
    this.listen(this, 'disconnect.selection', function() {
      this.element.removeClass('selected');
    });
  },
  move_position: function(event) {
    var x = event.clientX - this.element.parent().offset().left;
    x = Math.max(0, x);    
    this.key.frame = x * Breeze.animator.duration / this.element.parent().width();
    this.set_position(this.key.frame);
    
    event.bubbles = false;
    event.stopPropagation();
    this.parent().selection.add(this);
    Breeze.animator.update();
  }
});

var Timeline_Graph = Flower.sub_class('Timeline_Graph', {
  initialize: function() {
    Breeze.animator.set_frame(30);
    this.position = this.add_marker('current', Breeze.animator.frame);
    this.selection = Selection.create();
    this.connect(this.selection, 'selection', 'parent');
    
    this.listen(Breeze.animator, 'update', function() {
      this.position.set_position(Breeze.animator.frame);
    });
    
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);  
    this.click(function() {
      this.selection.disconnect_all('selected');
    });
  
    this.listen(Breeze.animator, 'emotion.change', this.update_keyframes);
  },
  add_marker: function(type, frame) {
    var marker = Timeline_Marker.create();
    marker.element.addClass(type);    
    this.connect(marker, type, 'parent');

    if (typeof frame == 'number')
      marker.set_position(frame);
    
    return marker;
  },
  add_keyframe_marker: function(key, target) {
    
    var marker = Keyframe_Marker.create();
    marker.element.addClass('keyframe');    
    this.connect(marker, 'keyframe', 'parent');
    marker.set_position(key.frame);
    marker.key = key;
    this.element.append(marker.element);
    marker.connect(target, 'source', 'timeline_marker');  
  },
  change_position: function(event) {
    var x = event.clientX - this.element.offset().left;
    x = Math.max(0, x);
    Breeze.animator.set_frame(x * Breeze.animator.duration / this.element.width());
    this.position.set_position(Breeze.animator.frame);
  },
  delete_selection: function() {
    var selected = this.selection.get_connections('selected');
    for (var x = 0; x < selected.length; x++) {
      var marker = selected[x];
      marker.get_connection('source').remove_key(marker.key);
      marker.disconnect_all();
    }
    
    Breeze.animator.update();
  },
  goto_previous_key: function() {    
    var frame = Breeze.animator.frame;
    var markers = this.get_connections('keyframe');
    if (markers.length == 0 || markers[0].frame > frame) {
      Breeze.animator.set_frame(0);
      return;
    }
    
    var marker = markers[0];
    
    for (var x = 1; x < markers.length; x++) {
      if (markers[x].frame >= frame)
        break;
      else
        marker = markers[x];
    }
      
    Breeze.animator.set_frame(marker.frame);
  },
  goto_next_key: function() {    
    var frame = Breeze.animator.frame;
    var markers = this.get_connections('keyframe');
    if (markers.length == 0 || markers[markers.length - 1].frame < frame) {
      Breeze.animator.set_frame(Breeze.animator.duration - 1);
      return;
    }
    
    var marker = markers[markers.length - 1];
    
    for (var x = markers.length - 2; x >= 0; x--) {
      if (markers[x].frame <= frame)
        break;
      else
        marker = markers[x];
    }
      
    Breeze.animator.set_frame(marker.frame);
  },
  petal_selected: function(petal) {
    var x, y, targets = petal.get_connections('animation');
    this.listen(petal, 'add.key', this.add_keyframe_marker);
    this.update_keyframes();
  },
  petal_deselected: function(petal) {
    var markers = this.get_connections('keyframe');
      
    for (var x = 0; x < markers.length; x++) {
      if (markers[x].get_connection('source').seed == petal)
        markers[x].disconnect_all();
    }
  },
  update: function() {
    this.range = Flower.create(this.element.parent().find('.range'));
    this.range.click(this.change_position, this);
    this.range.drag({
      owner: this, 
      moving: this.change_position
    });
    
    this.element.parent().append(this.position.element);
    this.position.set_position(Breeze.animator.frame);
  },
  update_keyframes: function() {
    var x, y, z, emotion = Breeze.animator.current_emotion();
    this.disconnect_all('keyframe');

    if (!emotion)
      return;
    
    var selection = Page.selection();
    for (var x = 0; x < selection.length; x++) {
      var channels = emotion.get_petal_targets(selection[x]);
      for (var y = 0; y < channels.length; y++) {
        var channel = channels[x];
        for (var z = 0; z < channel.keys.length; z++) {
          this.add_keyframe_marker(channel.keys[z], channel);
        }
      }
    }
  }
});

var Timeline_Panel = Flower.sub_class('Timeline_Panel', {
  block: 'timeline',
  initialize: function() {
    this.graph = Timeline_Graph.create(this.element.find('.graph'));
  }
});

var Properties_Panel = Editor.sub_class('Properties_Panel', {
  block: 'properties',
  initialize: function() {
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);
     
  },
  petal_selected: function(petal) {
    this.set_seed(petal, Page.iris_properties);
  },
  petal_deselected: function() {
    this.empty();
  }
});