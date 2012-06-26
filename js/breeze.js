var Breeze = (function() {
  'use strict';
  var Breeze = {};
  MetaHub.current_module = Breeze;
  var Meta_Object = MetaHub.Meta_Object;
  
  var Iris = Meta_Object.sub_class('Iris', {
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
      this.layers = [];
      var layer = document.createElement('g');
      //            this.element.appendChild(layer);
      this.layers.push(layer);
            
      this.listen(this, 'connect.child', function(child) {
        this.element.appendChild(child.element);
      });
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
        var path = Petal.create(paths[x], layers);
        path.animate(layers, x);
        this.connect(path, 'child', 'parent');
      }
      
      this.layers = layers;
    }
        
  });
  
  // Iris is the Breeze wrapper for an SVG Canvas
  MetaHub.extend(Iris, {
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
    points_to_string: function(points, curve_type) {
      var text = '';
      for (var x = 0; x < points.length; x++) {
        if (points[x].length > 2) {
          text += points[x][2];
        }
        else if (x > 0) {
          text += ' ';
        }
                
        text += points[x][0] + ', ' + points[x][1];
      }
        
      if (points.length > 2)
        text += 'z';
        
      return text;
    },
    make_point: function (x, y, command) {
      if (!x || !y)
        throw new Error('error');
      var point = [x, y];        
      if (command) {
        point.push(command);
      }
               
               if (!point)
                 throw new Error('what?');
      return point;
    },
    string_to_points: function(text) {
      var point, points = [], i, command, last_command,
      relative = false, numbers = text.match(/(\-?[\d\.]+|[A-Za-z])/g),
      x = 0, y = 0, last_x = 0, last_y = 0;
      
      //      console.log(numbers);
      for (i = 0; i < numbers.length; i += 2) {
        // Curve description letters are stored in the third index of a point array
        if (numbers[i].match(/[A-Za-z]/)) {
          command = numbers[i];
          if (command == 'z' || command == 'Z') {
            break;
          }
          i++;
          relative = command.match(/[a-z]/);
          if (relative) {
            command = command.toUpperCase();
          }
          
          last_command = command;
        }
        else {
          command = null;
        }
                           
        if (last_command == 'C') {
          if (relative) {            
            points.push(Iris.make_point(last_x + parseFloat(numbers[i]), last_y + parseFloat(numbers[i + 1]), command));
            i += 2;
          
            points.push(Iris.make_point(last_x + parseFloat(numbers[i]), last_y + parseFloat(numbers[i + 1])));
            i += 2;
          }
          else {
            points.push(Iris.make_point(parseFloat(numbers[i]),  parseFloat(numbers[i + 1]), command));
            i += 2;
          
            points.push(Iris.make_point( parseFloat(numbers[i]), parseFloat(numbers[i + 1])));
            i += 2;
          }
          
          command = null;
        }          
            
        if (!relative) {
          x = parseFloat(numbers[i]);
          y = parseFloat(numbers[i + 1]);
        }
        else {
          x += parseFloat(numbers[i]);
          y += parseFloat(numbers[i + 1]);
        }
        
        points.push(Iris.make_point(x, y, command));
        last_x = x;
        last_y = y;
      }        
      
      return points;
    },
    create_path: function(points) {
      var text = Iris.points_to_string(points);
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', text);
      return path;
    }
  });
  
  // Petal is the Breeze wrapper for an individual SVG object, usually a path
  var Petal = Meta_Object.sub_class('Petal', {
    keyframes: [],
    initialize: function(source, layers) {
      
      // Is DOM element
      //            if (typeof source.innerHTML == 'string') {
      //        
      //            }
      //      console.log('old: ' + layers[1].children[0].getAttribute('d'));

      this.element = source;
      if (layers) {
        for (var x = 0; x < layers.length; x++) {
          this.add_keyframe(layers[x]);     
        }
        
        this.points = jQuery.extend(true, [], this.keyframes[0]);
      }
      console.log(this.element.getAttribute('d'));
      this.set_path(this.points);
      console.log(this.element.getAttribute('d'));
    },
    add_keyframe: function(layer) {
      var path = Iris.string_to_points(layer.firstElementChild.getAttribute('d'));
      this.keyframes.push(path);
    },
    animate: function(layers) {
      animator.items.push(this);

    //            console.log('new: ' + text);
    },
    set_path: function(points) {
      var text = Iris.points_to_string(this.points);
      last_text = text;
      this.element.setAttribute('d', text);
    },
    update_animation: function(frame) {
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
        this.points[p][0] = animator.tween(start[0], end[0], frame, 100);        
        // p.y
        this.points[p][1] = animator.tween(start[1], end[1], frame, 100);
      }
      this.set_path(this.points);      
    }
  });
  var last_text;
  Breeze.import_all = function() {
    MetaHub.extend(window, Breeze);
  };
  
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
        animator.items[x].update_animation(animator.frame);
      }
      
      if (typeof animator.on_update == 'function') {
        animator.on_update(animator);
      }
    }
  };
  Breeze.animator = animator;
  return Breeze;
})();