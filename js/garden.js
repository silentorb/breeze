"use strict";
MetaHub.import_all(); 
Bloom.import_all();
Breeze.import_all();

var Page = {
  iris_properties: {
    'position.x': 'double',
    'position.y': 'double',
    'rotate': 'double',
    'scale.x': 'double',
    'scale.y': 'double',
    'anchor.x': 'double',
    'anchor.y': 'double'
  },
  history: [],
  project: null,
  initialize: function() {
    Breeze.animator.initialize_more();
    this.menu = this.create_menu();
    this.timeline = Timeline_Panel.create();
    $('.timeline.panel').append(this.timeline.element);
    this.timeline.graph.update();
    this.keyboard_actions();
    this.initialize_project_panel();
    
    this.properties = Properties_Panel.create();
    $('.properties.panel').append(this.properties.element);
    
    this.load_iris('deevee3.svg');
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
    this.project_panel.set_tab(scene);
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
    
    this.canvas.iris.layers[0].setAttribute('transform', 'scale(0.8, 0.8) translate(200, 0)');
    this.canvas.iris.layers[1].setAttribute('transform', 'scale(0.8, 0.8) translate(200, 0)');
  },
  create_menu: function() {
    var menu = Menu.create();
    $('body').prepend(menu.element);
    menu.target = Page;
    return menu;
  },
  keyboard_actions: function() {
    $(window).keypress(function(event) {
      var control = event.metaKey || event.ctrlKey;
      var used = true;
      console.log('charCode: ' + event.charCode + ', keyCode: ' + event.keyCode);
   
      switch(event.charCode) {
        case 32:
          event.preventDefault();
          if (Breeze.animator.is_playing) {
            Breeze.animator.stop();
          }
          else {
            Breeze.animator.play(Breeze.animator.frame);
          }
          break;
        case 91:
          Page.timeline.graph.goto_previous_key();
          event.preventDefault();     
          break;
        case 93:
          Page.timeline.graph.goto_next_key();
          event.preventDefault();      
          break;
        case 100:
          Page.timeline.graph.delete_selection();
          break;
        case 105: // 'i'
          var selection = Page.selection();
          for (var x = 0; x < selection.length; x++) {
            Breeze.animator.add_key(selection[x]);
          }
          break;
        case 112:
          var channels = Breeze.animator.active_channels;
          var index = channels.indexOf('path');
          if (index == -1)
            channels.push('path');
          else
            channels.splice(index, 1);
          break;
        case 122: // z
          if (control) {
                  
          }
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
    'tab-panel',
    'text-field'
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
    jQuery.get('projects/' + filename, function(response) {
      self.create_canvas();
      self.canvas.load(response);
      self.invoke('load', Page.canvas.iris);
      //            Breeze.animator.create_emotion();
      //          return;
      
      jQuery.get('projects/' + 'deevee.brz', function(response2) {
        Breeze.animator.load(response2, self.canvas.iris);
        Breeze.animator.emotion_selection.connect(Breeze.animator.emotions[0], 'selected', 'selection');

        //        var animator = Breeze.animator;
        //        var emotion = Emotion.create();
        //        animator.connect(emotion, 'emotion', 'parent');
        //        emotion.animator = animator;
        //        emotion.active(true);
        //        emotion.load(response2, self.canvas.iris);
        if (Breeze.animator.emotions.length > 0) {
          Breeze.animator.value('current_emotion', Breeze.animator.emotions[0]);      
        }

      }, 'json');
    }, 'xml');
  },
  new_iris: function() {
    this.create_canvas();
  },
  save_iris: function(filename) {
    filename = filename || 'deevee.brz';    
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

var Scene = Meta_Object.sub_class('Scene', {
  initialize: function() {
    this.scene.optimize_getter('children', 'child');
  }

});

var Project = Meta_Object.sub_class('Project', {
  initialize: function() {
    this.scene = Scene.create();
  }
});

var Scene_Item = Flower.sub_class('Scene_Item', {
  initialize: function() {
    this.element = $('<li>' + this.seed.element.id + '</li>');
  }
});

var Scene_Panel = Tree.sub_class('Scene_Panel', {
  block: 'scene',
  item_type: Scene_Item,
  initialize: function() {
    this.listen(Page, 'load', this.load);
    this.make_selectable(Page);
  },
  load: function(iris) {
    this.element.empty();
    this.watch_seed('child', iris.root);
  }
});

new Block('emotion', '<li></li>');

var Emotion_Flower = Flower.sub_class('Emotion_Flower', {
  block: 'emotion',
  initialize: function() {
    var self = this;
    this.element.text(this.seed.name);
    /*
    if (this.seed.active()) {
      this.element.addClass('selected');
    }
    
    this.listen(this.seed, 'selected', function(active) {
      if (active) {
        this.element.addClass('selected');
      }
      else {
        this.element.removeClass('selected');
      }
    });
    
    this.click(function() {
      if (!this.seed.active()) {
        Breeze.animator.value('current_emotion', this.seed, this);
      }
    });
    */
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
    this.make_selectable(Breeze.animator.emotion_selection);
    this.watch_seed('emotion');
  }
});

var Emotions_Panel = Flower.sub_class('Emotions_Panel', {
  block: 'emotions',
  initialize: function() {
    var self = this;
    this.list = Emotion_List.create(this.seed, this.element.find('.item-list'));
    this.element.find('.buttons li').click(function() {
      Breeze.animator.create_emotion();
    });       
  }
});

var Control_Point = Circle.sub_class('Control_Point', {
  cps: [],
  initialize: function () {
    var element = this.element;
    element.setAttribute('stroke', 'black');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('fill', 'red');
    this.listen(this, 'connect.parent', this.initialize_dragging);
  
    this.listen(this, 'connect.source', function() {
      var source = this.get_connection('source');
      this.attr('transform', source.attr('transform'));    
    });
      
    this.listen(Breeze.animator, 'update', function() {
      this.element.setAttribute('cx', this.point.x);
      this.element.setAttribute('cy', this.point.y);    
    });
  },
  initialize_dragging: function() {
    var self = this;
    // The canvas deselects all if any clicks reach it.
    this.element.addEventListener('click', function(event) {
      event.stopPropagation();  
    });
    
    this.drag(function(event) { 
      var point = Page.canvas.iris.convert_client_point(event.clientX, event.clientY);

      var source = self.get_connection('source');
      point = source.convert_to_local(point);
      self.move(point.x, point.y);
    }, function(event) {      
      var source = self.get_connection('source');
      if (Breeze.animator.is_recording) {
        Breeze.animator.add_key(source, 'path');
      }
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

var Canvas = Flower.sub_class('Canvas', {
  initialize: function () {
    
    var width = this.element.width();
    var height = this.element.height();
    this.iris = Iris.create(this.element[0],width, height);
    
    this.listen(this.iris, 'connect.object', this.initialize_petal);      
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);
      
    this.listen(this, 'disconnect-all', function() {
      this.iris.disconnect_all();
    });
    
    this.element.click(function() {
      Page.disconnect_all('selected');
    });
  },
  initialize_petal: function (petal) {
    this.listen(petal, 'click', function() {
      Page.disconnect_all('selected');
      Page.connect(petal, 'selected', 'selection');
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
    if (petal.points) {
      for (var x = 0; x < petal.points.length; x++) {
        var point = petal.points[x];
        var cp = this.create_control_point(petal, point, 4);
      
        if (point.cps) {
          for (var y = 0; y < point.cps.length; y++) {
            var child = this.create_control_point(petal, point.cps[y], 2);
            cp.cps.push(child);
          }
        }
      }
    }
  }
});

var Timeline_Marker = Flower.sub_class('Timeline_Marker', {
  initialize: function() {
    this.element = $('<div class="marker"></div>');
  },
  update_position: function() {
    var x = this.frame * this.parent().element.width() / Breeze.animator.duration;
    this.element.css('margin-left', x);
  },
  set_position: function(frame) {    
    this.frame = frame;
    this.update_position();
  }
});

var Keyframe_Marker = Timeline_Marker.sub_class('Keyframe_Marker', {
  keys: [],
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
    var frame = Math.round(x * Breeze.animator.duration / this.element.parent().width());
    for (x = 0; x < this.keys.length; x++) {
      this.keys[x].frame = frame;
    }
    this.set_position(frame);
    
    event.bubbles = false;
    event.stopPropagation();
    this.parent().selection.disconnect_all();
    this.parent().selection.connect(this, 'selected', 'selection');
    Breeze.animator.update();
  }
});

var Timeline_Graph = Flower.sub_class('Timeline_Graph', {
  initialize: function() {
    Breeze.animator.set_frame(30);
    this.position = this.add_marker('current', Breeze.animator.frame);
    this.selection = Meta_Object.create();
    this.connect(this.selection, 'selection', 'parent');
    
    this.listen(Breeze.animator, 'update', function() {
      this.position.set_position(Breeze.animator.frame);
    });
    
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);  
    this.click(function() {
      this.selection.disconnect_all('selected');
    });
  
    this.listen(Breeze.animator, 'change.current_emotion', this.update_keyframes);    
    this.listen(Breeze.animator, 'change.duration', this.update_marker_positions)
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
    var marker = this.get_keyframe(key.frame);
    
    if (!marker)
      marker = Keyframe_Marker.create();
  
    marker.element.addClass('keyframe');    
    this.connect(marker, 'keyframe', 'parent');
    marker.set_position(key.frame);
    marker.keys.push(key);
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
    var x, y, selected = this.selection.get_connections('selected');
    for (var x = 0; x < selected.length; x++) {
      var marker = selected[x];
      var source = marker.get_connection('source');
      for (y = 0; y < marker.keys.length; y++) {
        source.remove_key(marker.keys[y]);
      }
      marker.disconnect_all();
    }
    
    Breeze.animator.update();
  },
  get_keyframe: function(frame) {    
    var markers = this.get_connections('keyframe');

    for (var x = 0; x < markers.length; x++) {
      if (markers[x].frame == frame)
        return markers[x];
    }
      
    return null;
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
    var x, y, z, emotion = Breeze.animator.current_emotion;
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
  },
  update_marker_positions: function() {
    var markers = this.get_connections('keyframe');
      
    for (var x = 0; x < markers.length; x++) {
      markers[x].update_position();
    }
    
    this.position.set_position(Breeze.animator.frame);
  }
});

var Timeline_Status_Bar = Flower.sub_class('Timeline_Status_Bar', {
  initialize: function() {
    var recording = this.element.find('.live');
    recording.click(function() {
      recording.toggleClass('active');
      Breeze.animator.is_recording = recording.hasClass('active');
    });
            
    var duration = this.element.find('.duration input');
    Bloom.bind_input(duration, Breeze.animator, 'duration', this);    
    this.element.find('.play').click(function() {
      Breeze.animator.play(Breeze.animator.frame);
    });
  }
});

var Timeline_Panel = Flower.sub_class('Timeline_Panel', {
  block: 'timeline',
  initialize: function() {
    var element = this.element;
    this.graph = Timeline_Graph.create(element.find('.graph'));
    this.status_bar = Timeline_Status_Bar.create(element.find('.status-bar'));
  }
});

var Properties_Panel = Editor.sub_class('Properties_Panel', {
  block: 'properties',
  initialize: function() {
    this.listen(Page, 'connect.selected', this.petal_selected);
    this.listen(Page, 'disconnect.selected', this.petal_deselected);
    this.listen(this, 'connect.child', this.field_added);    
  },
  field_added: function(field) {
    var name = field.seed.name;
    if (name == 'path' || Page.iris_properties[name]) {
      var live = field.element.find('.live');
      if (Breeze.animator.active_channels.indexOf(name) != -1)
        live.addClass('active');

      live.click(function() {
        live.toggleClass('active');
        if (live.hasClass('active')) {
          Breeze.animator.active_channels.push(name);
        }
        else {
          Breeze.animator.active_channels.splice(name, 1);
        }
      });
    }
  },
  petal_selected: function(petal) {
    this.set_seed(petal, Page.iris_properties);
  },
  petal_deselected: function() {
    this.empty();
  }
});