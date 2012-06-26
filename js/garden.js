"use strict";

MetaHub.import_all(); 
Bloom.import_all();

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
    //    this.load_enchantment('test.ech');   
    $(window).keyup(function(event) {
      if (event.keyCode == 32) {
        
      }
    });
  },
  create_menu: function() {
    var menu = Menu.create();
    $('body').prepend(menu.element);
    menu.target = Page;
    return menu;
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

var Timeline = Flower.sub_class('Timeline', {
  initialize: function() {
    
  }
});
