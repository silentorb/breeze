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
        var path = Path.create(paths[x], layers);
        path.animate(layers, x);
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
    create_path: function(points) {
      var text = Iris.points_to_string(points);
      var path = Iris.create_element('path');
      path.setAttribute('d', text);
      return path;
    }
  });
  
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
    drag: function(action) {
      var element = this.element
      //      element.onmousedown = function() {
      //        console.log('hey!');
      //      };
      var mouseup = function() {
          document.removeEventListener('mouseup', mouseup);
          document.removeEventListener('mousemove', action);
        };
      element.addEventListener('mousedown', function(event) {
        document.addEventListener('mousemove', action, false);
        document.addEventListener('mouseup', mouseup, false);
        event.preventBubble();
      }, false);
    }
  });
  
  // Path is the Breeze wrapper for an individual SVG object, usually a path
  var Path = Petal.sub_class('Path', {
    keyframes: [],
    initialize: function(source, layers) {
      this.element = source;
      if (layers) {
        for (var x = 0; x < layers.length; x++) {
          this.add_keyframe(layers[x]);     
        }
        
        this.points = jQuery.extend(true, [], this.keyframes[0]);
      }
      this.set_path(this.points);
      this.initialize_element(this.element);
    },
    add_keyframe: function(layer) {
      var path = Iris.string_to_points(layer.firstElementChild.getAttribute('d'));
      this.keyframes.push(path);
    },
    animate: function() {
      animator.items.push(this);
    },
    set_path: function(points) {
      points = points || this.points;
      var text = Iris.points_to_string(points);
      last_text = text;
      this.element.setAttribute('d', text);
    },
    update: function(frame) {
      //console.log(frame/ 100);

      if (frame >= 100) {
        animator.items.splice(animator.items.indexOf(this), 1);
        console.log('new: ' + last_text);
        return;
      }
      var start, end;
      for (var p = 0; p < this.points.length; p++) {
        start = this.keyframes[0][p];
        end = this.keyframes[1][p];
        // p.x
        this.points[p].x = animator.tween(start.x, end.x, frame, 100);        
        // p.y
        this.points[p].y = animator.tween(start.y, end.y, frame, 100);
      }
      this.set_path(this.points);
    }
  });
  var last_text;
  
  var Circle = Petal.sub_class('Circle', {
    initialize: function(cx, cy, radius) {
      var self = this;
      this.element = Iris.create_element('circle');
      this.element.setAttribute('cx', cx);
      this.element.setAttribute('cy', cy);
      this.element.setAttribute('r', radius);
                  
      this.initialize_element(this.element);
    }    
  });
  
  var animator = {
    frame: 0,
    items: [],
    is_playing: false,
    length: 1000,
    play: function(frame) {
      this.frame = frame || 0;
      this.is_playing = true;
      this.interval_id = setInterval(animator.update, 1000 / 60);
    },
    stop: function() {
      this.is_playing = false;
      clearInterval(this.interval_id);
    },
    tween: function(start, end, time, duration) {
      return start + ((end - start) * time / duration);
    },
    update: function() {
      var x;      
      animator.frame++;
      //      document.getElementById('log').innerHTML = (animator.frame / 100);
      for (x = 0; x < animator.items.length; x++) {
        animator.items[x].update(animator.frame);
      }
      
      if (typeof animator.on_update == 'function') {
        animator.on_update(animator);
      }
    }
  };
  
  Breeze.import_all = function() {
    MetaHub.extend(window, Breeze);
  };
  
  
  Breeze.animator = animator;
  return Breeze;
})();