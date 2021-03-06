MetaHub.extend(Breeze.animator, {
  active_channels: [],
  is_recording: false,
  current_emotion: null,
  initialize_more: function() {
    this.listen(this, 'change.duration', function(value) {
      if (this.current_emotion) {
        this.current_emotion.duration = value;
      }
    });
    
    var selection = this.emotion_selection = Meta_Object.create();
    selection.active_emotions = this.active_emotions;
    selection.optimize_getter('active_emotions', 'selected');
    
    this.listen(selection, 'connect.selected', function(emotion) {
      for (var x = 0; x < Breeze.animator.active_emotions.length; ++x) {
        this.active_emotions[x].active(false);
      }
      
      this.value('duration', emotion.duration);
      emotion.active(true);
      Breeze.animator.current_emotion = emotion;
      
      var petals = Page.canvas.iris.objects;
      for (var x = 0; x < petals.length; ++x) {
        petals[x].reset();
      }
      this.update();
    });
  },
  add_key: function(seed, property) {
    var emotion = this.current_emotion;
    if (emotion) {
      if (property === undefined) {
        var channels = this.active_channels;
        for (var x = 0; x < channels.length; x++) {
          emotion.add_key(seed, channels[x]);
        }
      }
      else {
        emotion.add_key(seed, property); 
      }
    }
  }
});

MetaHub.extend(Breeze.Petal.properties, {
  initialize_more: function() {
    var self = this;  

    this.element.onclick = function(event) {
      event.stopPropagation();
      self.invoke('click', event);
    };
  
    this.listen(this, 'change', function(name, value, source) {
      if (Breeze.animator.is_recording) {
        Breeze.animator.add_key(this, name);
      }
      
      this.update_transform();
    });
    
    this.initialize_dragging();
  },
  initialize_dragging: function() {
    var self = this, last;
    // The canvas deselects all if any clicks reach it.   
    if (this.points) {
      this.drag(function(event) { 
        var point = Page.canvas.iris.convert_client_point(event.clientX - last.x, event.clientY - last.y);
        event.preventBubble();
        event.stopPropagation();  

        point = self.convert_to_local(point);
        self.value('position.x', self.position.x + event.clientX - last.x);
        self.value('position.y', self.position.y + event.clientY - last.y);
      
        last = {
          x: event.clientX,
          y: event.clientY
        }
      }, function() {      
        if (Breeze.animator.is_recording) {
          Breeze.animator.add_key(self, 'position.x');
          Breeze.animator.add_key(self, 'position.y');
        }
      }, function(event) {  
        last = {
          x: event.clientX,
          y: event.clientY
        }
      });
    }
  },
  update_transform: function() {
    var transform = this.generate_transform();
    this.attr('transform', transform);
    var overlay_objects = this.get_connections('overlay');
    for (var x = 0; x < overlay_objects.length; x++) {
      overlay_objects[x].attr('transform', transform);
    }
  }
});

MetaHub.extend(Breeze.Animation_Target.properties, {
  save: function() {
    var target = this.seed.element.id;
    if (!target) {
      target = this.seed.parent().objects.indexOf(this);  
    }
    
    var result = {
      target: target,
      property: this.property,
      keys: this.keys
    };
      
    return result;
  }
});

MetaHub.extend(Breeze.Emotion.properties, {
  save: function() {
    var x, targets = [], result = {};
 
    for (x = 0; x < this.targets.length; x++) {
      targets.push(this.targets[x].save());
    }
    
    result.name = this.name;
    result.duration = this.duration;
    result.targets = targets;
    return result;
  }
});