

var Menu = Flower.sub_class('Menu', {
  block: 'menu',
  target: {},
  initialize: function() {
    var self = this;
    
    this.element.find('ul ul').hide();
    this.element.find('li').click(function(event) {
      event.stopPropagation();
      var sub_menu = $(this).parent().find('ul');
      if (sub_menu.length > 0) {
        if (sub_menu.is(':hidden')) {
          sub_menu.show();
          var f = function() {
            sub_menu.hide();
            $(window).unbind('click', f);
          };          
          $(window).click(f);
        }
        else {
          sub_menu.hide();
        }
      }
      else {
        var text = $(this).attr('action');
        
        if (text.length < 1) {
          var span = sub_menu.find('span');
        
          if (span.length == 1) {
            text = span.text();
          }
          else {
            text = $(this).text();
          }
      
          text = text.toLowerCase().replace(' ','_');
        }
        
        // The quick and easy way to work with events
        if (typeof self.target[text] == 'function')
          self.target[text]();
        
        // The more flexible way.
        self.invoke(text);
        self.element.find('ul ul').hide();
      }  
    });
  }
});