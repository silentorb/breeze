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
    initialize: function() {
      
      this.listen(this, 'disconnect-all', function() {
        this.element.parentNode.removeChild(this.element);
      });
    },
    initialize_element: function(element) {
      var self = this;
      //      console.log(this.element.getAttribute('d'));
      //      this.element.addEventListener('click', function(event) {
      //        self.invoke('click', event);
      //      }, false);      
     
      element.onclick = function(event) {
        event.stopPropagation();
        self.invoke('click', event);
      };  
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
    }
  });
  
  var Path = Petal.sub_class('Path', {
    initialize: function(source) {
      this.element = source;
      
      this.points = Iris.string_to_points(source.getAttribute('d'));
      this.original_points = jQuery.extend(true, [], this.points);
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
        data: jQuery.extend(true, [], this.get_original_data())
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
        key.data = this.clone_current_data();
        this.invoke('modify.key', key, this);
      }
    },
    clone_current_data: function() {
      return jQuery.extend(true, [], this.get_current_data());
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
        data: this.clone_current_data()
      };
      
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
    update: function(frame, animator) {
      var p, start, end, points = this.seed.points,
      keys = this.get_current_keys(frame, this.keys),
      duration;
      
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
    }
  });
  
  var Emotion = Meta_Object.sub_class('Emotion', {
    duration: 100,
    frame: 0,
    targets: [],
    save: function() {
      var x, targets = [], result = {};
    
      for (x = 0; x < this.targets.length; x++) {
        targets.push(this.targets[x].save());
      }
    
      result.targets = targets;
      result.duration = this.duration;
      return result;
    },
    update: function(increment, animator) {
      this.frame += increment;
      for (var x = 0; x < this.targets.length; x++) {
        this.targets[x].update(this.frame, this);
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
        this.emotions.splice(this.emotions.indexOf(item), 1);
        var x = this.active_emotions.indexOf(item);
        if (x > -1)
          this.active_emotions.splice(x, 1);
      });
    },
    add_key: function(seed, property) {
      var target = this.get_target(seed, property);
      
      if (!target) {
        if (property == 'path') {
          target = Path_Target.create(seed);
          target.add_initial_key();
          this.connect(target, 'target', 'parent');
        }
      }      
      target.add_key(Breeze.animator.frame);
    },
    load: function(data, iris) {
      var x, targets = data.targets;
       
      for (x = 0; x < targets.length; x++) {
        this.load_target(targets[x], iris.get_petal(data.targets[x].target));
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
      
      for (var x = 0; x < this.emotions.length; x++) {
        this.active_emotions[x].update(1, this);
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