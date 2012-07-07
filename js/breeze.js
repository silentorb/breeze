var Breeze = (function() {
  'use strict';
  var Breeze = {};
  MetaHub.current_module = Breeze;
  var Meta_Object = MetaHub.Meta_Object;
  
  var Iris = Meta_Object.sub_class('Iris', {
    layers: [],
    initialize: function(element, width, height) {
      if (typeof element == 'string') {
        element = document.getElementById(element);
      }

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element.appendChild(svg);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.setAttribute('version', '1.1');
      this.element = svg;

      this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.element.appendChild(this.defs);
      this.create_layer('paper');
      this.create_layer('overlay');
      
      this.listen(this, 'connect.child', function(child) {
        this.element.getElementsByClassName('paper')[0].appendChild(child.element);
      });
      this.listen(this, 'connect.overlay', function(child) {
        this.element.getElementsByClassName('overlay')[0].appendChild(child.element);
      });
    },
    create_layer: function(name) {
      var layer = Iris.create_element('g');
      layer.setAttribute('class', name);
      this.element.appendChild(layer);
      this.layers.push(layer);
    },
    get_petal: function(id) {
      var petals = this.get_connections('child');
      for (var x = 0; x < petals.length; x++) {
        if (petals[x].element.id == id)
          return petals[x];
      }
    
      return null;
    },
    load_data: function(data) {
      var x, defs = data.getElementsByTagName('defs');
      for (x = 0; x < defs.length; x++) {
        for (var y = 0; y < defs[x].childElementCount; y++) {
          this.defs.appendChild(defs[x].children[y]);
        }
      }
          
      var layers = data.getElementsByTagName('g');
      var paths = layers[0].getElementsByTagName('path');
      for (x = 0; x < paths.length; x++) {
        var path = Path.create(paths[x]);
        //        path.animate(layers, x);
        this.connect(path, 'child', 'parent');
      }
      
      this.layers = layers;
    }
        
  });
  
  // Iris is the Breeze wrapper for an SVG Canvas
  MetaHub.extend(Iris, {
    create_element: function(type) {
      return document.createElementNS('http://www.w3.org/2000/svg', type);
    },
    //    points_to_string: function(points, curve_type) {
    //      var text = 'M ' + points[0][0] + ', ' + points[0][1] + ' ' + curve_type;
    //      for (var x = 1; x < points.length; x++) {
    //        text += ', ' + points[x][0] + ', ' + points[x][1];
    //      }
    //        
    //      if (points.length > 2)
    //        text += 'z';
    //        
    //      return text;
    //    },
    points_to_string: function(points) {
      var point, mode, text = '';
      for (var x = 0; x < points.length; x++) {
        point = points[x];
        if (point.mode && point.mode != mode) {
          mode = point.mode;
          text += mode;          
        }
        else if (x > 0) {
          text += ' ';
        }
          
        if (point.cps) {
          text += point.cps[0].x + ', ' + point.cps[0].y + ' ';
          text += point.cps[1].x + ', ' + point.cps[1].y + ' ';
        }
        text += point.x + ', ' + point.y;
      }
        
      if (points.length > 2)
        text += 'z';
        
      return text;
    },
    string_to_points: function(text) {
      var point, points = [], i, mode = 'M',
      relative = false, numbers = text.match(/(\-?[\d\.]+|[A-Za-z])/g),
      last_x = 0, last_y = 0;
      
      function add_point(mode) {
        var point;
        if (relative) {
          point = {
            x: last_x + parseFloat(numbers[i]), 
            y: last_y + parseFloat(numbers[i + 1])
          };        
        }
        else {
          point = {
            x: parseFloat(numbers[i]), 
            y: parseFloat(numbers[i + 1])
          };        
        }
        if (mode) {
          point.mode = mode;
        }
        i += 2;
        return point;
      }
      
      //      console.log(numbers);
      for (i = 0; i < numbers.length;) {
        // Curve description letters are stored in the third index of a point array
        if (numbers[i].match(/[A-Za-z]/)) {
          mode = numbers[i];
          if (mode == 'z' || mode == 'Z') {
            break;
          }
          i++;
          relative = mode.match(/[a-z]/);
          if (relative) {
            mode = mode.toUpperCase();
          }
        }
              
        if (mode == 'C') {
          var cp1 = add_point();
          var cp2 = add_point();
          var point = add_point(mode);
          point.cps = [ cp1, cp2];
        }
        else {
          var point = add_point(mode);
        }
        
        points.push(point);
        last_x = point.x;
        last_y = point.y;
      }        
      
      console.log(points);
      return points;
    },
    string_to_points2: function(text) {
      var point, points = [], i, mode = 'M',
      relative = false, numbers = text.match(/(\-?[\d\.]+|[A-Za-z])/g),
      last_x = 0, last_y = 0, cps = [];
      
      function add_point(mode) {
        var point;
        if (relative) {
          point = {
            x: last_x + parseFloat(numbers[i]), 
            y: last_y + parseFloat(numbers[i + 1])
          };        
        }
        else {
          point = {
            x: parseFloat(numbers[i]), 
            y: parseFloat(numbers[i + 1])
          };        
        }
        if (mode) {
          point.mode = mode;
        }
        i += 2;
        return point;
      }
      
      //      console.log(numbers);
      for (i = 0; i < numbers.length;) {
        // Curve description letters are stored in the third index of a point array
        if (numbers[i].match(/[A-Za-z]/)) {
          mode = numbers[i];
          if (mode == 'z' || mode == 'Z') {
            break;
          }
          i++;
          relative = mode.match(/[a-z]/);
          if (relative) {
            mode = mode.toUpperCase();
          }
        }
              
        if (mode == 'C') {
          
          var cp1 = add_point();
          var cp2 = add_point();
          var point = add_point(mode);
          point.cps = [ cp1, cp2 ];
        }
        else {
          var point = add_point(mode);
        }
        
        points.push(point);
        last_x = point.x;
        last_y = point.y;
      }        
      
      console.log(points);
      return points;
    },
    create_path: function(points) {
      var text = Iris.points_to_string(points);
      var path = Iris.create_element('path');
      path.setAttribute('d', text);
      return path;
    }
  });
  
  // Petal is the Breeze wrapper for an individual SVG object, usually a path
  var Petal = Meta_Object.sub_class('Petal', {
    translate_x: 0,
    translate_y: 0,
    rotate: 0,
    scale_x: 1,
    scale_y: 1,
    anchor_x: 0,
    anchor_y: 0,
    initialize: function() {
      
      this.listen(this, 'disconnect-all', function() {
        this.element.parentNode.removeChild(this.element);
      });
      
      this.value = Meta_Object.value;
    },
    attr: function(name, value) {
      if (value !== undefined) {
        this.element.setAttribute(name, value);
        return value;
      }
      
      return this.element.getAttribute(name);
    },
    initialize_element: function(element) { 
      // Can't get the bounding box until placed on the canvas
      this.listen(this, 'connect.parent', function() {          
        var size = this.size();
        this.anchor_x = size.width / 2;
        this.anchor_y = size.height / 2;      
        this.parse_transform();
      });
    },
    drag: function(action, finished) {
      var element = this.element
      //      element.onmousedown = function() {
      //        console.log('hey!');
      //      };
      var mouseup = function(event) {
        event.preventDefault();
        document.removeEventListener('mouseup', mouseup);
        document.removeEventListener('mousemove', action);
        if (typeof finished == 'function') {
          finished(event);
        }
      };
      element.addEventListener('mousedown', function(event) {
        event.preventDefault();
        document.addEventListener('mousemove', action, false);
        document.addEventListener('mouseup', mouseup, false);
        event.preventBubble();
      }, false);
    },
    generate_transform: function() {
      var result = '';
      result += 'translate(' + this.translate_x + ',' + this.translate_y + ')';
      result += 'rotate(' + this.rotate + ',' + this.anchor_x + ',' + this.anchor_y + ')';
      
      return result;
    },
    size: function() {
      return this.element.getBBox();
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
            this.translate_x = transform[2];
            this.translate_y = transform[3];
            break;
        }        
      }
    }
  });
  
  var Path = Petal.sub_class('Path', {
    initialize: function(source) {
      this.element = source;
      
      this.points = Iris.string_to_points(source.getAttribute('d'));
      this.original_points = MetaHub.deep_clone(this.points);
      this.set_path(this.points);
      this.initialize_element(this.element);
    },
    set_path: function(points) {
      points = points || this.points;
      var text = Iris.points_to_string(points);
      this.element.setAttribute('d', text);
    }
  });
  
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
    save: function() {
      var result = {
        target: this.seed.element.id,
        property: this.property,
        keys: this.keys
      };
      
      return result;
    },
    update: function(frame, animator) {
      var duration, keys = this.get_current_keys(frame, this.keys);
      if (keys.length > 1)
        duration = keys[1].frame - keys[0].frame;
      
      this.internal_update(frame, animator, keys, duration);
    },
    update_transform: function() {
      var transform = this.generate_transform();
      this.attr('transform', transform);
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
        frame -= keys[0].frame;
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
      var x, targets = data.targets;
      
      this.duration = data.duration;
      this.name = data.name;
      
      for (x = 0; x < targets.length; x++) {
        this.load_target(targets[x], iris.get_petal(data.targets[x].target));
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
    save: function() {
      var x, targets = [], result = {};
 
      for (x = 0; x < this.targets.length; x++) {
        targets.push(this.targets[x].save());
      }
    
      result.name = this.name;
      result.duration = this.duration;
      result.targets = targets;
      return result;
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
  
  Breeze.import_all = function() {
    MetaHub.extend(window, Breeze);
  };
    
  Breeze.animator = Animator.create();
  return Breeze;
})();