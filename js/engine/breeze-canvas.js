if (!window.Breeze)
  var Breeze = {};

(function(Breeze) {
  'use strict';
  
  MetaHub.current_module = Breeze;
  var Meta_Object = MetaHub.Meta_Object;
  
  Breeze.normalize_group = function(target) {
    var x, children, child, x1, y1, x2, y2;
    children = target.children;
    
    if (children && children.length > 0) {
      child = children[0];
      var x1 = child.left, y1 = child.top;
      var x2 = x1 + child.width, y2 = y1 + child.height;
    
      for (x = 1; x < children.length; x++) {
        child = children[x];
        if (child.left < x1)
          x1 = child.left;
        else if (child.left + child.width > x2)
          x2 = child.left + child.width;
        if (child.top < y1)
          y1 = child.top;
        else if (child.top + child.height > y2)
          y2 = child.top + child.height;
          
      }
      
      target.width = 1 + x2 - x1;
      target.height = 1 + y2 - y1;
      target.left = x1;
      target.top = y1;
    }
  };
  
  Breeze.get_child_points = function(target) {
    var x, points = target.points || [];
    var children = target.children;
    
    if (children) {
      for (x = 0; x < children.length; x++) {
        points = points.concat(Breeze.get_child_points(children[x]));
      }
    }
    
    return points;
  };
  
  Breeze.get_dimensions = function(points) {
    var x, point;
    
    var x1 = points[0].x, y1 = points[0].y;
    var x2 = x1, y2 = y1;
    
    for (x = 1; x < points.length; x++) {
      point = points[x];
      if (point.x < x1)
        x1 = point.x;
      else if (point.x > x2)
        x2 = point.x;
      
      if (point.y < y1)
        y1 = point.y;
      else if (point.y > y2)
        y2 = point.y;
    }
    
    return {
      width: 1 + x2 - x1,
      height: 1 + y2 - y1,
      left: x1,
      top: y1
    };
  };
  
  Breeze.normalize = function(target, points) {
    var x, points = points || target.points, point;
    //    if (!points || points.length == 0) {
    //      Breeze.normalize_group(target);
    //      return;
    //    }
    
    var x1 = points[0].x, y1 = points[0].y;
    var x2 = x1, y2 = y1;
    
    for (x = 1; x < points.length; x++) {
      point = points[x];
      if (point.x < x1)
        x1 = point.x;
      else if (point.x > x2)
        x2 = point.x;
      
      if (point.y < y1)
        y1 = point.y;
      else if (point.y > y2)
        y2 = point.y;
    }
    
    var center_x = x1 + ((x2 - x1) / 2);
    var center_y = y1 + ((y2 - y1) / 2);
    
    //    if (!target.position)
    //      target.position = Point(center_x, center_y);
    
    for (x = 0; x < points.length; x++) {
      points[x].x -= center_x;
      points[x].y -= center_y;
    }
    
    target.width = 1 + x2 - x1;
    target.height = 1 + y2 - y1;
    target.left = x1 - center_x;
    target.top = y1 - center_y;
  };

  Breeze.normalize_transform = function(target) {
    var child, children = target.children;
    var offset = {
      x: -(target.width / 2) - target.left,
      y: -(target.height / 2) - target.top
    };
    for (var x = 0; x < children.length; x++) {
      child = children[x];
      child.offset = offset;
    }    
  };
  
  var Petal = Meta_Object.sub_class('Petal', {
    rotate: 0,
    initialize: function(source) {     
      this.position = Point.create(0, 0);
      this.scale = Point.create(1, 1);
      this.anchor = Point.create(0,0);
      this.value = Meta_Object.deep_value;
    }
  });
  
  var Shape = Petal.sub_class('Shape', {
    initialize: function(source) {
      if (source)
        MetaHub.extend(this, source);
      
      this.normalize();  
    },
    convert_to_local: function(point) {
      var globalToLocal = this.element.getTransformToElement(this.parent().element).inverse();
      return point.matrixTransform( globalToLocal );
    },
    normalize: function() {
      var x, points = this.points;
      if (!points || points.length == 0)
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
    }
  });
  
  Shape.render = function(shape, canvas) {
    var x, points = shape.points;
    canvas.save();
        
    if (shape.name == 'left-foot')
      debug_point(shape.position);

    if (shape.offset)
      canvas.translate(shape.offset.x, shape.offset.y);
    
    if (shape.position)
      canvas.translate(shape.position.x, shape.position.y);
    
    if (shape.scale && (shape.scale.x != 1 || shape.scale.y != 1))
      canvas.scale(shape.scale.x, shape.scale.y);
    
    if (shape.rotate != undefined && shape.rotate != 0)
      canvas.rotate(Math.PI / shape.rotate);
  
    if (points) {
      canvas.beginPath();
      if (shape.line_join)
        canvas.lineJoin = shape.line_join;
      if (shape.line_cap)
        canvas.lineCap = shape.line_cap;
      
      canvas.moveTo(points[0].x, points[0].y);
      
      for (x = 1; x < points.length; x++) {
        canvas.lineTo(points[x].x, points[x].y);
      }
      
      if (shape.fill) {
        canvas.fillStyle = shape.fill;
        canvas.fill();
      }
      
      if (shape.close_path)
        canvas.closePath();
      
      if (shape.line_width) {
        canvas.lineWidth = shape.line_width;    
        canvas.stroke();
      }
    }
    //    else if (shape.data) {
    //      canvas.fillRect(shape.data.left, shape.data.top, shape.data.width, shape.data.height);
    //    }
    
    if (shape.children) {
      for (x = 0; x < shape.children.length; x++) {
        Shape.render(shape.children[x], canvas);
      }      
    }
    
    canvas.restore();
  };
  
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


  var Iris = Petal.sub_class('Iris', {
    initialize: function(data) {
      this.optimize_getter('children', 'child');
      this.optimize_getter('emotions', 'emotion');
      this.data = data;

      for (var x = 0; x < data.children.length; ++x) {
        var petal = Shape.create(data.children[x]);
        this.connect(petal, 'child', 'parent');
      }
    
      this.objects = {};
      Iris.get_child_ids(this, this.objects);
    },
    get_petal: function(id) {
      //      if (id != "left-foot")
      //        return null;
      
      return this.objects[id];
    },
    load_emotion: function(data) {
      var x, emotions = data.emotions;
      
      for (x = 0; x < emotions.length; x++) {
        var emotion = Emotion.create();
        emotion.animator = this;
        emotion.load(emotions[x], this);
        this.connect(emotion, 'emotion', 'parent');
      }
    }
  });
  
  Iris.get_child_ids = function(parent, objects) {
    var child, children = parent.children;
    if (!children)
      return;
    
    for (var x = 0; x < children.length; x++) {
      child = children[x];
      objects[child.name] = child;
      Iris.get_child_ids(child, objects);
    }
  };
  
  var Scene = Meta_Object.sub_class('Scene', {
    initialize: function() {
      this.optimize_getter('children', 'child');
    },
    render: function(canvas) {
      for (var x = 0; x < this.children.length; x++) {
        Shape.render(this.children[x], canvas);
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
    'line': 'line',
    'rect': 'rect',
    'g': 'g',
    'path': 'path'
  };

})(Breeze);

Breeze.loader = {
  scale: Point.create(1,1),
  style_attributes: {
    'fill': 'fill',
    'stroke-width': 'line_width',
    'stroke-linejoin': 'line_join',
    'stroke-linecap': 'line_cap'
  },
  check_attributes: function(element, owner, properties) {
    var name, info, property_name, style = element.getAttribute('style');
    if (style) {
      var styles = style.split(';');
      for (var x in styles) {
        info = styles[x].split(/\n*:\n*/);
        property_name = properties[info[0]];
        if (property_name) {
          owner[property_name] = info[1];
        }
      }
    }
    
    for (name in properties) {
      var result = element.getAttribute(name);
      if (result)
        owner[properties[name]] = result;
    }
  },
  get_float_x: function(element, property) {
    if (property)
      return Breeze.loader.scale.x * parseFloat(element.getAttribute(property));
    else
      return Breeze.loader.scale.x * parseFloat(element);
  },
  get_float_y: function(element, property) {
    if (property)
      return Breeze.loader.scale.y * parseFloat(element.getAttribute(property));
    else
      return Breeze.loader.scale.y * parseFloat(element);
  },
  parse_line: function(element) {
    return [{
      x: Breeze.loader.get_float_x(element, 'x1'),
      y: Breeze.loader.get_float_y(element, 'y1')
    }, {
      x: Breeze.loader.get_float_x(element, 'x2'),
      y: Breeze.loader.get_float_y(element, 'y2')
    }];
  },
  parse_path: function(text) {
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
      
    for (i = 0; i < numbers.length;) {
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
  parse_object: function(element, parser, normalize) {
    if (normalize === undefined)
      normalize = true;
    
    var result = {};
    if (parser == 'polyline')
      result.points = Breeze.loader.parse_polyline(element.getAttribute('points'));
    else if (parser == 'line')
      result.points = Breeze.loader.parse_line(element);
    else if (parser == 'rect')
      result.points = Breeze.loader.parse_rect(element);
    else if (parser == 'path')
      result.points = Breeze.loader.parse_path(element.getAttribute('d'));
    
    Breeze.loader.check_attributes(element, result, Breeze.loader.style_attributes);
    
    if (element.nodeName == 'polygon') {
      result.close_path = true;
      
      if (!result.fill)
        result.fill = '#000000';
    }
    
    var transform = Breeze.loader.parse_transform(element);
    if (transform) {
      MetaHub.extend(result, transform);
    }
    
    var children = [];
    for (var x = 0; x < $(element).children().length; x++) {
      var type = Breeze.element_types[$(element).children()[x].nodeName];
      if (type) {
        var petal = Breeze.loader.parse_object($(element).children()[x], type, normalize);
        children.push(petal);
      }
    }
    
    if (children.length > 0) {
      result.children = children;
    }
     
    if (normalize) {
      Breeze.normalize(result);
    }
    
    if (element.id)
      result.name = element.id;
    
    return result;
  },
  parse_polyline: function(text) {
    var points = [], numbers = text.match(/\-?[\d\.]+/g);
    
    for (var x = 0; x < numbers.length; x += 2) {
      points.push({
        x: Breeze.loader.get_float_x(numbers[x]),
        y: Breeze.loader.get_float_y(numbers[x + 1])
      });
    }
    
    return points;
  },
  parse_rect: function(element) {
    var x = Breeze.loader.get_float_x(element, 'x')
    ,   y = Breeze.loader.get_float_y(element, 'y')
    ,   width = Breeze.loader.get_float_x(element, 'width')
    ,   height = Breeze.loader.get_float_y(element, 'height')
    ;
    
    return [
    {
      x: x,
      y: y
    },
    
    {
      x: x + width,
      y: y
    },
    
    {
      x: x + width,
      y: y + height
    },
    
    {
      x: x,
      y: y + height
    }
    ];    
  },
  parse_svg: function(data, normalize) {

    //    var svg = data.getElementsByTagName('svg')[0];
    var svg = $(data).find('svg');
    var result = Breeze.loader.parse_object(svg[0], 'g', false);
    if (normalize) {
      var points = Breeze.get_child_points(result);
      MetaHub.extend(result, Breeze.get_dimensions(points));
    Breeze.normalize_transform(result);          
    }

    return result;
  },
  parse_transform: function(element) {
    var transform_string = element.getAttribute('transform');
    if (!transform_string)
      return null;
    
    var result = {};
    
    var transforms = transform_string.split(/\s+(?!\()/);
    for (var x = 0; x < transforms.length; x++) {
      var transform = transforms[x].match(/[\w\d\.\-]+/g);
      switch (transform[0]) {
        case 'translate':
          result.position = {
            x: Breeze.loader.get_float_x(transform[1]),
            y: Breeze.loader.get_float_y(transform[2])
          };
          break;
        case 'rotate':
          result.rotate = parseFloat(transform[1]);
          if (transform[2])
            result.anchor.x = parseFloat(transform[2]);
          if (transform[3])
            result.anchor.y = parseFloat(transform[3]);
          break;
        case 'scale':
          result.scale.x = Breeze.loader.get_float_x(transform[1]);
          result.scale.y = Breeze.loader.get_float_y(transform[2]);
          break;
      }
    }
    
    return result;
  }
};