
var Breeze = Meta_Object.sub_class('Breeze', {
    paper: null,
    overlay: null,
    initialize: function(paper, overlay) {
        this.paper = Raphael(paper, 640, 480);
        this.overlay = Raphael(overlay, 640, 480);
    },
    points_to_string: function(points, curve_type) {
        var text = 'M ' + points[0][0] + ' ' + points[0][1] + ' ' + curve_type;
        for (var x = 1; x < points.length; x++) {
            text += ' ' + points[x][0] + ' ' + points[x][1];
        }
        
        if (points.length > 2)
            text += 'z';
        
        return text;
    },
    create_path: function(points, curve_type) {
        var text = this.points_to_string(points, curve_type);
        return this.paper.path(text);  
    },
    string_to_points: function(text) {
        var numbers = text.match(/\d+/g);
        var points = [];
        for (var x = 0; x < numbers.length; x += 2) {
            points.push([parseFloat(numbers[x]), parseFloat(numbers[x + 1])]);
        }
        
        return points;
    },
    get_points: function (path) {
        var text = path.getAttribute('d');
        //$('#path')[0].setAttribute('d', "M150 0 L75 300 L225 200 Z");
        return this.string_to_points(text);
    },
    draw_control_points: function(points) {
        this.overlay.clear();
        for (var x = 0; x < points.length; x++) {
            this.overlay.circle(points[x][0], points[x][1], 2);
        }
    }
});

var Petal = Meta_Object.sub_class('Element', {
    initialize: function(breeze) {
        this.breeze = breeze;
    }
});

var Control_Point = Meta_Object.sub_class('Control_Point', {
    initialize: function(overlay, point, index) {
        var self = this;
        this.point = point;
        this.point[2] = this;
        this.index = index;
        this.element = overlay.circle(point[0], point[1], 4);
        this.element.attr("fill", "#f00");
        this.element.drag(function (event) {
            //            console.log(arguments[2] + ', ' + arguments[3]);
            self.point[0] = arguments[2];
            self.point[1] = arguments[3];
            self.element.attr({
                cx: self.point[0], 
                cy: self.point[1]
            });
                
            var parent = self.parent();
            parent.points[self.index] = self.point;
            parent.update();
        });
        
        this.element.dblclick(function (event) {
            self.add_point();
        });
    },
    add_point: function() {
        var parent = this.parent();
        var points = parent.points;
        var next_point = parent.get_point(this.index + 1);
        
        // get middle
        var new_point = [
        this.point[0] + ((next_point[0] - this.point[0]) / 2),
        this.point[1] + ((next_point[1] - this.point[1]) / 2)
        ];
        console.log(new_point);
        points.splice(this.index + 1, 0, new_point);
        parent.create_control_point(new_point, this.index + 1);
        
        for (var x = this.index + 2; x < points.length; x++) {
            points[x][2].index += 1;
        }
        parent.update();
    }
});

var Control_Line = Meta_Object.sub_class('Control_Line', {
    initialize: function(breeze, points, curve_type) {
        var text = breeze.points_to_string(points, curve_type);
        this.element = breeze.overlay.path(text);
        //        this.element = breeze.create_path(points, curve_type);
        this.element.attr('stroke-width', 3);
    }
});

var Path = Petal.sub_class('Path', {
    draw: function(points, curve_type) {
        var self = this;
        this.points = points;
        this.curve_type = curve_type;
        this.element = this.breeze.create_path(points, curve_type);
        this.element.attr('stroke-width', 1);
        
//        this.element.mousedown(function (event) {
//            
//            });
        for (var x = 0; x < points.length; x++) {
//            this.create_line([points[x], this.get_point(x + 1), [-1,-1]]);
        }
        
        this.create_control_points(points);
    },
    create_control_point: function(point, index) {
        var cp = Control_Point.create(this.breeze.overlay, point, index);
            this.connect(cp, 'cp', 'parent');
    },
    create_control_points: function(points) {       
        for (var x = 0; x < points.length; x++) {
            this.create_control_point(points[x], x);
        }
    },
    create_line: function(points) {
        var line = Control_Line.create(this.breeze, points, this.curve_type);
        this.connect(line, 'line', 'parent');
    },
    get_point: function(index) {
        if (index >= 0)
            return this.points[index % this.points.length];
        else
            return this.points[this.points.length - (-index % this.points.length)];
    },
    update: function() {
        this.element.attr('path', this.breeze.points_to_string(this.points, this.curve_type));
    }
});