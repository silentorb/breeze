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
    this.menu = this.create_menu();
    this.timeline = Timeline_Panel.create();
    var canvas = $('#canvas');
    this.iris = Iris.create(canvas[0], canvas.width(), canvas.height());
    $('.timeline.panel').append(this.timeline.element);
    
    //    this.load_enchantment('test.ech');   
    this.keyboard_actions();
    
    // Breeze.animator provides a simple, fast hook that can only supports one connection.
    // The animator program wraps a more powerful hook around it that supports multiple connections.
    Breeze.animator.on_update = function() {
      Page.invoke('frame-change', Breeze.animator);
    }    
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
  load_enchantment: function(filename) {
    filename = 'test.ech';
    var self = this;
    Bloom.get('server/' + filename, function(response) {
      self.enchantment = response;
    });
  },
  new_enchantment: function() {
    this.enchantment = MetaHub.clone(Enchantment);
  },  
  save_enchantment: function(filename) {
    filename = 'test.ech';
    var data = {
      'data': JSON.stringify(this.enchantment),
      'filename': filename
    };
    Bloom.post('server/store-enchantment.php', data, function() {
      
      });
  }
};

$(function () {
  MetaHub.metanize(Page);  
  Page.load();
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
