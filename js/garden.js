"use strict";

MetaHub.import_all(); 
Bloom.import_all();
Breeze.import_all();

var Page = {
  load: function() {
    Block.source_path = "html";

    var blocks = [
    'timeline',
    'menu'
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
  initialize: function() { 
    var self = this;
    this.menu = this.create_menu();
    this.timeline = Timeline_Panel.create();
    $('.timeline.panel').append(this.timeline.element);
    
    this.keyboard_actions();
    
    // Breeze.animator provides a simple, fast hook that can only supports one connection.
    // The animator program wraps a more powerful hook around it that supports multiple connections.
    Breeze.animator.on_update = function() {
      Page.invoke('frame-change', Breeze.animator);
    }    
    
    this.load_iris('breeze-test3.svg');   
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
    this.canvas.element.click(function() {
      self.disconnect_all('selected');
    });
  },
  create_menu: function() {
    var menu = Menu.create();
    $('body').prepend(menu.element);
    menu.target = Page;
    return menu;
  },
  keyboard_actions: function() {
    $(window).keypress(function(event) {
      switch(event.charCode) {
        case 32:
          if (Breeze.animator.is_playing) {
            Breeze.animator.stop();
          }
          else {
            Breeze.animator.play(Breeze.animator.frame);
          }
          break;          
      }
    });
  },
  load_iris: function(filename) {
    //    filename = 'test.ech';
    var self = this;
    jQuery.get('images/' + filename, function(response) {
      self.create_canvas();
      self.canvas.load(response);
    });
  },
  new_iris: function() {
    this.create_canvas();
  },  
  //  save_iris: function(filename) {
  //    filename = 'test.ech';
  //    var data = {
  //      'data': JSON.stringify(this.iris),
  //      'filename': filename
  //    };
  //    Bloom.post('server/store-iris.php', data, function() {
  //      
  //      });
  //  },
  selection: function() {
    return this.get_connections('selected');
  }
};

$(function () {
  MetaHub.metanize(Page);  
  Page.load();
});

var Control_Point = Circle.sub_class('Control_Point', {
  cps: [],
  initialize: function () {
    var self = this, element = this.element;
    element.setAttribute('stroke', 'black');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('fill', 'red');
    this.listen(this, 'connect.parent', function() {
      this.drag(function(event) { 
        var offset = $(element).parent().offset();
        self.move(event.clientX - offset.left, event.clientY - offset.top);
      });
    });    
  },
  move: function(x, y) {
    var offset_x = x - this.point.x;
    var offset_y = y - this.point.y;
    this.point.x = x;
    this.point.y = y; 
    this.element.setAttribute('cx', x);
    this.element.setAttribute('cy', y);
    
    for (var i = 0; i < this.cps.length; i++) {
      var cp = this.cps[i];
      cp.move(cp.point.x + offset_x, cp.point.y + offset_y);
    }
    this.get_connection('source').set_path();
  }
});

var Canvas = Flower.sub_class('Canvas', {
  initialize: function () {
    
    var width = this.element.width();
    var height = this.element.height();
    this.iris = Iris.create(this.element[0],width, height);
    
    this.listen(this.iris, 'connect.child', function(petal) {
      this.listen(petal, 'click', function() {
        Page.connect(petal, 'selected', 'page');
      });
    });
      
    this.listen(this, 'connect.parent', function(parent) {
      this.unlisten(this, 'connect.parent');
      this.listen(parent, 'connect.selected', function(petal) {
        this.overlay_petal(petal);
      });
      this.listen(parent, 'disconnect.selected', function(petal) {
        petal.get_connections('overlay').forEach(function(cp) {
          cp.disconnect_all();
        });
      });
    });      
    this.listen(this, 'disconnect-all', function() {
      this.iris.disconnect_all();
    });
  },
  load: function(data) {
    this.iris.load_data(data);
  },
  overlay_petal: function(petal) {
    for (var x = 0; x < petal.points.length; x++) {
      var point = petal.points[x];
      var cp = this.create_control_point(petal, point, 8);
      
      if (point.cps) {
        for (var y = 0; y < point.cps.length; y++) {
          var child = this.create_control_point(petal, point.cps[y], 6);
          cp.cps.push(child);
        }
      }
    }
  },
  create_control_point: function(petal, point, size) {
    var cp = Control_Point.create(point.x, point.y, size);
    this.iris.connect(cp, 'overlay', 'parent');      
    petal.connect(cp, 'overlay', 'source');  
    cp.point = point;
    return cp;
  }
});

var Timeline_Graph = Flower.sub_class('Timeline_Graph', {
  initialize: function() {
    var self = this;
    Breeze.animator.frame = 100;
    this.position = Flower.create('<div class="position"></div>');
    this.element.append(this.position.element);
    this.update_position();
    this.element.click(function(event) {
      var x = event.clientX - self.element.offset().left;
      Breeze.animator.frame = x * Breeze.animator.length / self.element.width() ;
      self.update_position(x);
    });
    
    this.listen(Page, 'frame-change', function() {
      this.update_position(Breeze.animator.frame * self.element.width() / Breeze.animator.length);
    });
  },
  update_position: function(x) {     
    this.position.element.css('margin-left', x);
  }
});

var Timeline_Panel = Flower.sub_class('Timeline_Panel', {
  block: 'timeline',
  initialize: function() {
    this.graph = Timeline_Graph.create(this.element.find('.graph'));
  }
});
