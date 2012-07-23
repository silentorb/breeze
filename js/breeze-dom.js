if (!window.Breeze)
  var Breeze = {};

(function(Breeze) {
 
  var Iris = Meta_Object.sub_class('Iris', {
    layers: [],
    initialize: function(element, width, height) {
      
      this.optimize_getter('objects', 'object');
      
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
      
    //      this.listen(this, 'connect.child', function(child) {
    //        this.element.getElementsByClassName('paper')[0].appendChild(child.element);
    //      });
      this.listen(this, 'connect.overlay', function(child) {
        this.element.getElementsByClassName('overlay')[0].appendChild(child.element);
      });
    },
    convert_client_point: function(x, y) {
      var pt = this.element.createSVGPoint();
      pt.x = x;
      pt.y = y;
      var global_point = pt.matrixTransform(this.element.getScreenCTM().inverse());
      return global_point;
    },
    create_layer: function(name) {
      var layer = Iris.create_element('g');
      layer.setAttribute('class', name);
      this.element.appendChild(layer);
      this.layers.push(layer);
    },
    get_petal: function(id) {
      var petals = this.get_connections('object');
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

      var svg = $(data).find('svg');
      this.root = this.load_element(svg[0]);
      var children = svg.children();
      var paper = this.element.getElementsByClassName('paper')[0];
      for (x = 0; x < children.length; x++) {
        paper.appendChild(children[x]);
      }
    },
    load_element: function(element) {
      var type = Iris.element_types[element.nodeName];
      if (!type)
        return;
      
      var petal = type.create(element);
      this.connect(petal, 'object', 'iris');
        
      var elements = $(element).children(); 
      for (var x = 0; x < elements.length; x++) {
        var child = this.load_element(elements[x]);
        if (child) {
          petal.connect(child, 'child', 'parent');
          element.appendChild(child.element);
        }
      }
      
      return petal;
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
    position: Point.create(0, 0),
    rotate: 0,
    scale: Point.create(1, 1),
    anchor: Point.create(0, 0),
    initialize: function() {      
      this.listen(this, 'disconnect-all', function() {
        if (this.element.parentNode)
          this.element.parentNode.removeChild(this.element);
      });
      
      this.position = Point.create(0, 0);
      this.value = Meta_Object.deep_value;
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
        if (this.points) {
          this.parse_transform();
          this.normalize();
          this.reset();
          this.set_path();
        }
        else {
        //          var size = this.size();
        //          this.anchor.x = size.width / 2;
        //          this.anchor.y = size.height / 2;      
        //          this.parse_transform();
        }        
      });
    },
    convert_to_local: function(point) {
      var canvas = this.get_connection('iris').element;
      var globalToLocal = this.element.getTransformToElement(canvas).inverse();
      return point.matrixTransform( globalToLocal );
    },
    drag: function(action, finished, start) {
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
        if (typeof start == 'function') {
          start(event);
        }
      }, false);
    },
    generate_transform: function() {
      var result = '';
      if (this.position.x || this.position.y)
        result += 'translate(' + this.position.x + ',' + this.position.y + ')';
    
      if (this.rotate)
        result += 'rotate(' + this.rotate + ',' + this.anchor.x + ',' + this.anchor.y + ')';
      
      if (this.scale.x != 1 || this.scale.y != 1)
        result += 'scale(' + this.scale.x + ',' + this.scale.y + ')';
    
      return result;
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
      
      this.position.x += center.x;
      this.position.y += center.y;
      
      for (x = 0; x < points.length; x++) {
        points[x].x -= center.x;
        points[x].y -= center.y;
      }
      
      return center;
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
            this.position.x = parseFloat(transform[2]);
            this.position.y = parseFloat(transform[3]);
            break;
          case 'rotate':
            this.rotate = parseFloat(transform[0]);
            if (transform[1])
              this.anchor.x = parseFloat(transform[1]);
            if (transform[2])
              this.anchor.y = parseFloat(transform[2]);
            break;
          case 'scale':
            this.scale.x = parseFloat(transform[2]);
            this.scale.y = parseFloat(transform[3]);
            break;
        }        
      }
    },
    reset: function() {
      this.update_transform();
    },
    update_transform: function() {
      var transform = this.generate_transform();
      this.attr('transform', transform);
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
  
  var Group = Petal.sub_class('Group', {
    initialize: function(source) {
      this.element = source;
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
  
  Iris.element_types = {
    'path': Path,
    'polyline': Polyline,
    'polygon': Polyline,
    'line': Line,
    'g': Group,
    'svg': Group
  };
})(Breeze);