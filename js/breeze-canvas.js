if (!window.Breeze)
  var Breeze = {};

(function(Breeze) {
  'use strict';

  MetaHub.current_module = Breeze;
  var Meta_Object = MetaHub.Meta_Object;

  var Petal = Meta_Object.sub_class('Petal', {
    translate_x: 0,
    translate_y: 0,
    rotate: 0,
    scale_x: 1,
    scale_y: 1,
    anchor_x: 0,
    anchor_y: 0,
    initialize: function(source) {
      MetaHub.extend(this, source);
      this.value = Meta_Object.value;
    },
    convert_to_local: function(point) {
      var globalToLocal = this.element.getTransformToElement(this.parent().element).inverse();
      return point.matrixTransform( globalToLocal );
    },
    normalize: function() {
      var x, points = this.points;
      var center = {
        x: points[0].x,
        y: points[0].y
      }
      
      for (x = 1; x < points.length; x++) {
        center.x += points[x].x;  
        center.y += points[x].y;
      }
      
      center.x /= points.length;
      center.y /= points.length;
      
      this.translate_x += center.x;
      this.translate_y += center.y;
      
      for (x = 0; x < points.length; x++) {
        points[x].x -= center.x;
        points[x].y -= center.y;
      }
      
      return center;
    },
    render: function(canvas) {
      var points = this.points;
      canvas.save();
      canvas.beginPath();
      canvas.scale(0.2, 0.2);
      if (this.line_join)
        canvas.lineJoin = this.line_join;
      if (this.line_cap)
        canvas.lineCap = this.line_cap;
      
      canvas.moveTo(points[0].x, points[0].y);
    
      for (var x = 1; x < points.length; x++) {
        canvas.lineTo(points[x].x, points[x].y);
      }
      
      if (this.fill) {
        canvas.fillStyle = this.fill;
        canvas.fill();
      }
      
      if (this.close_path)
        canvas.closePath();
      
      if (this.line_width) {
        canvas.lineWidth = this.line_width;    
        canvas.stroke();
      }
      
      canvas.restore();
    }
  });
  
  var Line = Petal.sub_class('Line', {
    initialize: function(source) {
      this.element = source;
      
      //      this.points = Iris.string_to_points(source.getAttribute('d'));
      //      this.original_points = MetaHub.deep_clone(this.points);
      //      this.set_path(this.points);
      this.initialize_element(this.element);
    },
    set_path: function(points) {
    //      points = points || this.points;
    //      var text = Iris.points_to_string(points);
    //      this.element.setAttribute('d', text);
    }
  });
  
  var Path = Petal.sub_class('Path', {
    initialize: function(source) {
      this.element = source;
      
      this.points = Iris.string_to_points(source.getAttribute('d'));
      this.original_points = MetaHub.clone(this.points);
      this.set_path(this.points);
      this.initialize_element(this.element);
    },
    set_path: function(points) {
      points = points || this.points;
      var text = Iris.points_to_string(points);
      this.element.setAttribute('d', text);
    }
  });
  
  var Polyline = Petal.sub_class('Polyline', {
    initialize: function(source) {
      this.element = source;
      
      this.points = Polyline.string_to_points(source.getAttribute('points'));
      this.original_points = MetaHub.clone(this.points);
      this.set_path(this.points);
      this.initialize_element(this.element);
    },
    set_path: function(points) {
      points = points || this.points;
      
      var text = '';
      for (var x = 0; x < points.length; x++) {
        text += ' ' + points[x].x + ',' + points[x].y;
      }
      this.element.setAttribute('points', text);
    }
  });
  
  Polyline.string_to_points = function(text) {
    var points = [], numbers = text.match(/\-?[\d\.]+/g);
    
    for (var x = 0; x < numbers.length; x += 2) {
      points.push({
        x: parseFloat(numbers[x]),
        y: parseFloat(numbers[x + 1])
      });
    }
      
    return points;
  }
  
  var Circle = Petal.sub_class('Circle', {
    initialize: function(cx, cy, radius) {
      var element = this.element = Iris.create_element('circle');      
      element.setAttribute('cx', cx);
      element.setAttribute('cy', cy);
      element.setAttribute('r', radius);
       
      this.initialize_element(element);
    }    
  });
  
  var Animation_Target = Meta_Object.sub_class('Animation_Target', {
    keys: [],
    initialize: function(seed) {
      this.seed = seed;
      this.connect(seed, 'seed', 'animation');
      seed.listen(this, 'add.key', function(key, target) {
        this.invoke('add.key', key, target);
      });
      
      seed.listen(this, 'modify.key', function(key, target) {
        this.invoke('modify.key', key, target);
      });
      
      seed.listen(this, 'remove.key', function(key, target) {
        this.invoke('remove.key', key, target);
      });
    },
    add_initial_key: function() {            
      var key = {
        frame: 0, 
        data: MetaHub.deep_clone(this.get_original_data())
      };
      this.keys = [key];    
      this.invoke('add.key', key, this);
    },
    add_key: function(frame) {
      var key = this.get_key(frame);
      if (!key) {
        this.insert_key(frame);
      }
      else {
        key.data = this.get_current_data();
        if (typeof key.data == 'object')
          key.data = MetaHub.deep_clone(key.data);
        
        this.invoke('modify.key', key, this);
      }
    },
    get_current_keys: function(frame, keys) {
      var x;
      
      for (x = 0; x < keys.length; x++) {
        if (keys[x].frame >= frame) {
          if (x == 0 || keys[x].frame == frame) {
            return [ keys[x] ];
          }

          return [ keys[x - 1], keys[x] ];          
        }          
      }
      
      return [ keys[keys.length - 1] ];
    },
    get_key: function(frame) {
      var keys = this.keys;
      for (var x = 0; x < keys.length; x++) {
        if(keys[x].frame == frame)
          return keys[x];
      }
    
      return null;
    },
    insert_key: function(frame) {
      var keys = this.keys;
      
      for (var x = 0; x < keys.length; x++) {
        if (keys[x].frame > frame)
          break;
      }
    
      var key = {
        frame: frame, 
        data: this.get_current_data()
      };
      
      if (typeof data == 'object') {
        key.data = MetaHub.deep_clone(key.data);
      }
      
      keys.splice(x, 0, key);
      
      this.invoke('add.key', key, this);
    },
    remove_key: function(key) {
      this.keys.splice(this.keys.indexOf(key), 1);
    },
    update: function(frame, animator) {
      var duration, keys = this.get_current_keys(frame, this.keys);
      if (keys.length > 1)
        duration = keys[1].frame - keys[0].frame;
      
      this.internal_update(frame - keys[0].frame, animator, keys, duration);
    }
  });
  
  var Path_Target = Animation_Target.sub_class('Path_Target', {
    property: 'path',
    get_current_data: function() {
      return this.seed.points;
    },
    get_original_data: function() {
      return this.seed.original_points;
    },
    internal_update: function(frame, animator, keys, duration) {
      var p, start, end, points = this.seed.points;
      
      if (keys.length == 1) {
        for (p = 0; p < points.length; p++) {
          points[p].x = keys[0].data[p].x;
          points[p].y = keys[0].data[p].y;
        }
      }
      else {  
        duration = keys[1].frame - keys[0].frame;
        for (p = 0; p < points.length; p++) {
          start = keys[0].data[p];
          end = keys[1].data[p];
          // p.x
          points[p].x = animator.tween(start.x, end.x, frame, duration);        
          // p.y
          points[p].y = animator.tween(start.y, end.y, frame, duration);
        }
      }
      
      this.seed.set_path(points);
    //      this.attr('transform', this.generate_transform());
    }
  });
  
  var Double_Target = Animation_Target.sub_class('Double_Target', {
    property: 'double', // Temporary
    initialize: function() {
      this.seed['original_' + this.property] = this.get_current_data();
    },
    get_current_data: function() {
      return this.seed[this.property];
    },
    get_original_data: function() {
      return this.seed['original_' + this.property];
    },
    internal_update: function(frame, animator, keys, duration) {
      var value;
      if (keys.length == 1) {
        value = keys[0].data;
      }
      else {
        value = animator.tween(keys[0].data, keys[1].data, frame, duration);
      }
      
      this.seed.value(this.property, value, this.seed);
      
      this.seed.update_transform();

    //      this.attr('transform', this.generate_transform());
    }
  });
  
  var Emotion = Meta_Object.sub_class('Emotion', {
    duration: 100,
    frame: 0,
    name: 'New',
    targets: [],
    initialize: function() {
      // In general, do not directly modify the targets array
      this.optimize_getter('targets', 'target');
      this.value = Meta_Object.value;
    },
    active: function(value) {
      var active_emotions = this.parent().active_emotions,
      x = active_emotions.indexOf(this);
      
      if (value !== undefined) {
        if (value) {
          if (x == -1) {
            active_emotions.push(this);
            this.invoke('active', true);
          }
        }
        else {
          if (x > -1) {
            active_emotions.splice(x, 1);
            this.invoke('active', false);
          }
        }
      }
    
      return x > -1;
    },
    add_key: function(seed, property) {
      var target = this.get_target(seed, property);
      
      if (!target) {
        if (property == 'path') {
          target = Path_Target.create(seed);
        }
        else {
          target = Double_Target.create(seed);
          target.property = property;
        }
        
        //        target.add_initial_key();
        this.connect(target, 'target', 'parent');
      }   
      target.add_key(Breeze.animator.frame);
    },
    get_petal_targets: function(petal) {
      var result = [], targets = this.targets;
      
      for (var x = 0; x < targets.length; x++) {
        if (targets[x].seed === petal)
          result.push(targets[x]);
      }
      
      return result;
    },
    get_target: function(seed, property) {
      var target, x;
    
      for (x = 0; x < this.targets.length; x++) {
        target = this.targets[x];
        if (target.seed === seed && target.property == property) {
          return target;
        }
      }      
      return null;
    },
    load: function(data, iris) {
      var x, channel, target, targets = data.targets;
      
      this.duration = data.duration;
      this.name = data.name;
      
      for (x = 0; x < targets.length; x++) {
        channel = targets[x];
        target = channel.target;
        if (typeof target == 'number') {
          target = iris.objects[target];
        }
        else {
          target = iris.get_petal(channel.target);
        }
        this.load_target(channel, target);
      }
    },
    load_target: function(data, petal) {
      var target;
      
      if (data.property == 'path') {
        target = Path_Target.create(petal);
      }
      else {
        target = Double_Target.create(petal);
        target.property = data.property;
      }
        
      target.keys = data.keys;
      this.connect(target, 'target', 'parent');
      return target;
    },
    update: function(frame, animator) {
      this.frame = frame;
      for (var x = 0; x < this.targets.length; x++) {
        this.targets[x].update(this.frame, animator, this);
      }
    }
  });
  
  var Animator = Meta_Object.sub_class('Animator', {
    frame: 0,
    is_playing: false,
    duration: 100,
    emotions: [],
    active_emotions: [],
    initialize: function() {
      this.value = Meta_Object.value;

      // In general, do not directly modify the targets array
      this.optimize_getter('targets', 'target');
      
      //      this.optimize_getter('emotions', 'emotion'); 
      this.listen(this, 'connect.emotion', function(item) {          
        this.emotions.push(item);
      });
          
      this.listen(this, 'disconnect.emotion', function(item) {
        item.active(false);
        this.emotions.splice(this.emotions.indexOf(item), 1);        
      });
    },
    create_emotion: function() {
      var emotion = Emotion.create();
      emotion.animator = this;
      this.connect(emotion, 'emotion', 'parent');
      return emotion;
    },
    load: function(data, iris) {
      var x, targets = data.targets || [], emotions = data.emotions || [];
       
      for (x = 0; x < targets.length; x++) {
        this.load_target(targets[x], iris.get_petal(data.targets[x].target));
      }
      
      for (x = 0; x < emotions.length; x++) {
        var emotion = Emotion.create();
        emotion.animator = this;
        emotion.load(emotions[x], iris);
        this.connect(emotion, 'emotion', 'parent');
      }
    },
    load_target: function(data, petal) {
      var target;
      
      if (data.property == 'path') {
        target = Path_Target.create(petal);
      }
        
      target.keys = data.keys;
      this.connect(target, 'target', 'parent');
      return target;
    },
    next: function() {
      if (this.frame && this.frame >= this.duration) {
        this.stop();
        return;
      }
      this.frame++;
      this.update();
    },
    play: function(frame) {
      var self = this;
      this.frame = frame || 0;
      this.last_frame = this.frame;
      this.is_playing = true;
      this.interval_id = setInterval(function() {
        self.next();
      }, 1000 / 60);
    },
    set_frame: function(frame) {
      this.frame = frame;
      this.update();
    },
    stop: function() {
      this.is_playing = false;
      clearInterval(this.interval_id);
      this.set_frame(this.last_frame);
    },
    tween: function(start, end, time, duration) {
      return start + ((end - start) * time / duration);
    },
    update: function() {
      //      document.getElementById('log').innerHTML = (animator.frame / 100);
      for (var x = 0; x < this.targets.length; x++) {
        this.targets[x].update(this.frame, this);
      }
      
      for (var x = 0; x < this.active_emotions.length; x++) {
        this.active_emotions[x].update(this.frame, this);
      }
      
      this.invoke('update');
    }
  });
  
  var Iris = Meta_Object.sub_class('Iris', {
    initialize: function(data) {
      this.optimize_getter('children', 'child');
      for (var x = 0; x < data.length; ++x) {
        var petal = Petal.create(data[x]);
        this.connect(petal, 'child', 'parent');
      }
    },
    render: function(canvas){
      for (var x = 0; x < this.children.length; x++) {
        this.children[x].render(canvas);
      }
    }   
  });
  
  var Canvas = Meta_Object.sub_class('Canvas', {  
    initialize: function(element) {
      this.optimize_getter('children', 'child');
    
      if (typeof element == 'string')
        element = document.getElementById(element);
  
      var context = this.context = element.getContext("2d");
    },
    render: function(){
      for (var x = 0; x < this.children.length; x++) {
        this.children[x].render(this.context);
      }
    }
  });

  Breeze.element_types = {
    //    'path': Path,
    'polyline': 'polyline',
    'polygon': 'polyline',
    'line': 'line'
  };
    
  Breeze.import_all = function() {
    MetaHub.extend(window, Breeze);
  };
  
  Breeze.loader = {
    check_attributes: function(element, owner, properties) {
      for (var name in properties) {
        var result = element.getAttribute(name);
        if (result)
          owner[properties[name]] = result;
      }
    },
    parse_line: function(source) {
      return [{
        x: source.getAttribute('x1'),
        y: source.getAttribute('y1')
      }, {
        x: source.getAttribute('x2'),
        y: source.getAttribute('y2')
      }];
    },
    parse_petal: function(source, parser) {
      var result = {};
      if (parser == 'polyline')
        result.points = Breeze.loader.parse_polyline(source.getAttribute('points'));
      else if (parser == 'line')
        result.points = Breeze.loader.parse_line(source);
      
      Breeze.loader.check_attributes(source, result, {
        'fill': 'fill',
        'stroke-width': 'line_width',
        'stroke-linejoin': 'line_join',
        'stroke-linecap': 'line_cap'
      });
      
      if (source.nodeName == 'polygon') {
        result.close_path = true;
       
        if (!result.fill)
          result.fill = '#000000';
      }
        
      return result;
    },
    parse_polyline: function(text) {
      var points = [], numbers = text.match(/\-?[\d\.]+/g);
    
      for (var x = 0; x < numbers.length; x += 2) {
        points.push({
          x: parseFloat(numbers[x]),
          y: parseFloat(numbers[x + 1])
        });
      }
      
      return points;
    },
    parse_svg: function(data) {
      //    var x, defs = data.getElementsByTagName('defs');
      //    for (x = 0; x < defs.length; x++) {
      //      for (var y = 0; y < defs[x].childElementCount; y++) {
      //        this.defs.appendChild(defs[x].children[y]);
      //      }
      //    }
     
      var nodes = data.getElementsByTagName('*');
      var elements = [];
      for (var x = 0; x < nodes.length; x++) {
        elements.push(nodes[x]);
      }
      
      var result = [];
      for (var x = 0; x < elements.length; x++) {
        var type = Breeze.element_types[elements[x].nodeName];
        if (type) {
          var petal = Breeze.loader.parse_petal(elements[x], type);
          result.push(petal);
        }
      }
    
      return result;
    },
    parse_transform: function() {
      var transform_string = this.attr('transform');
      if (!transform_string)
        return;
      
      var transforms = transform_string.split(/\s+(?!\()/);
      for (var x = 0; x < transforms.length; x++) {
        var transform = transforms[x].match(/(\w+)(.*?([\d\.]+))/);
        switch (transform[1]) {
          case 'translate':
            this.translate_x = parseFloat(transform[2]);
            this.translate_y = parseFloat(transform[3]);
            break;
          case 'rotate':
            this.rotate = parseFloat(transform[0]);
            if (transform[1])
              this.anchor_x = parseFloat(transform[1]);
            if (transform[2])
              this.anchor_y = parseFloat(transform[2]);
            break;
          case 'scale':
            this.scale_x = parseFloat(transform[2]);
            this.scale_y = parseFloat(transform[3]);
            break;
        }        
      }
    }
  };
  
  Breeze.animator = Animator.create();
})();