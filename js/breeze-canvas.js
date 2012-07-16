if (!window.Breeze)
  var Breeze = {};

(function(Breeze) {
  'use strict';

  MetaHub.current_module = Breeze;
  var Meta_Object = MetaHub.Meta_Object;

  Breeze.normalize = function(points) {
    var x;
        
    if (points.length == 2 && (points[0].x == points[1].x || points[0].y == points[1].y))
      return;
      
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
  };
  
  var Position = Breeze.Position = {
    create: function() {
      return {
        x: 0,
        y: 0
      };  
    }
  };
  var Petal = Meta_Object.sub_class('Petal', {
    rotate: 0,
    scale_x: 1,
    scale_y: 1,
    anchor_x: 0,
    anchor_y: 0,
    initialize: function(source) {     
      this.position = Position.create();
      this.value = Meta_Object.value;         
    }
  });

  var Shape = Petal.sub_class('Shape', {
    initialize: function(source) {
      if (source)
        MetaHub.extend(this, source);

    },
    convert_to_local: function(point) {
      var globalToLocal = this.element.getTransformToElement(this.parent().element).inverse();
      return point.matrixTransform( globalToLocal );
    },
    render: function(canvas) {
      var points = this.points;
      canvas.save();
      canvas.translate(this.position.x, this.position.y);
      if (this.scale_x != 1 || this.scale_y != 1)
        canvas.scale(this.scale_x, this.scale_y);
      
      //      canvas.scale(0.2, 0.2);

      canvas.beginPath();
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
  
  var Line = Shape.sub_class('Line', {
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
  
  var Path = Shape.sub_class('Path', {
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
  
  var Polyline = Shape.sub_class('Polyline', {
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
  
  var Iris = Petal.sub_class('Iris', {
    initialize: function(data) {
      this.optimize_getter('children', 'child');
      var points = [];
      for (var x = 0; x < data.length; ++x) {
        var petal = Shape.create(data[x]);
        this.connect(petal, 'child', 'parent');
      }
      
       Breeze.normalize(this.points);
    },
    render: function(canvas) {
      canvas.save();
      canvas.translate(this.position.x, this.position.y);
      //      if (this.scale_x != 1 || this.scale_y != 1)
      canvas.scale(this.scale_x * 0.2, this.scale_y * 0.2);
      
      for (var x = 0; x < this.children.length; x++) {
        this.children[x].render(canvas);
      }
      
      canvas.restore();
    }   
  });
  
  var Scene = Meta_Object.sub_class('Scene', {
    initialize: function() {
      this.optimize_getter('children', 'child');
    },
    render: function(canvas) {
      for (var x = 0; x < this.children.length; x++) {
        this.children[x].render(canvas);
      }
    }
  });
  
  var Canvas = Meta_Object.sub_class('Canvas', {  
    initialize: function(element) {
      if (typeof element == 'string')
        element = this.element = document.getElementById(element);
  
      var context = this.context = element.getContext("2d");
    },
    clear: function() {
      this.context.clearRect(0, 0, this.element.width, this.element.height);
    }
  });

  Breeze.element_types = {
    //    'path': Path,
    'polyline': 'polyline',
    'polygon': 'polyline',
    'line': 'line'
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
            this.position.x = parseFloat(transform[2]);
            this.position.y = parseFloat(transform[3]);
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
  
})(Breeze);