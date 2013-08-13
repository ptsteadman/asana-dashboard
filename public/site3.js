(function($) {


  // Sets underscore template tags to {{}} in order not to cause problems 
  // with EJS (ejs is not actually used)  

  //_.templateSettings = { interpolate : /\{\{(.+?)\}\}/g };

  // ROUTER 

var TaskRouter = Backbone.Router.extend({

      routes: {
          "" : "home",
          "recentlyCompleted": "recentlyCompleted",
          "tags":"tags",
          "search":"search"
      },

      home: function(){
          //Presenter.showView(home);
      },

      recentlyCompleted: function(){
          Presenter.showView(recentTasksView);
      },

      tags: function(){
          Presenter.showViews([tagListView, tagListView.tagSearchForm]);
      },

      search: function(){
          Presenter.showViews([taskListView, taskListView.taskFilterForm, taskListView.taskSearchForm]);
      }

  });

  // PRESENTER (simple class to show and hide arrays of views)
  // The 0th element in currentViewArray is the main view and needs to be toggled
  var Presenter = {
    showViews: function(viewArray){
      $('#main-content').html('<p style="text-align: center; margin-top: 15px;">Loading...</p>');
      if(this.currentViewArray){
        this.toggleNav(this.currentViewArray[0].menuId);
        for (var i = 0; i < this.currentViewArray.length; i ++ ){
          this.currentViewArray[i].remove();
        }
      }
      this.currentViewArray = viewArray;
      this.toggleNav(this.currentViewArray[0].menuId);
      for (var n = 0; n < this.currentViewArray.length; n ++ ){
        this.currentViewArray[n].render();
      }
    },

    toggleNav: function(menuId){
      var nav = $("#sidebar-nav a[href='" + menuId + "']").parent();
      if(nav.hasClass('active')){
        nav.removeClass("active");
      } else {
        nav.addClass("active");
      }
    }
  }

  // TEMPLATE CACHE (to increase speed of rendering 1000+ views)
  var TemplateCache = {
    get: function(selector){
      if (!this.templates){ this.templates = {}; }

      var template = this.templates[selector];
      if (!template){
        var tmpl = $(selector).html();
        template = _.template(tmpl);
        this.templates[selector] = template;
      }
      return template;
    }
  }

  // CONTROL FORMS (need to figure out how to create and destroy)

  var TaskFilterForm = Backbone.View.extend({
    el: "#task-filter-form",

    initialize: function(){
      $("#workspace-filter").append(this.createSelect());
      this.render();
      this.$el.hide();
    },

    events: {
      "change select": "selectHandler",
    },

    createSelect: function () {
      var select = $("<select class='form-control'/>", {
        html: "<option>Select Team</option>"
      });

      _.each(taskListView.getWorkspaces(), function (workspace) {
        var option = $("<option/>", {
          value: workspace.toLowerCase(),
          text: workspace.toLowerCase()
        }).appendTo(select);
      });
      return select;
    },

    selectHandler: function(event){
      Backbone.trigger('selectChanged', event);
    },

    render: function(){
      this.$el.show();
    },

    remove: function(){
      this.$el.hide();
    }
  });

  var TaskSearchForm = Backbone.View.extend({
    el: "#task-search-form",

    events: {
      "keyup input": "searchHandler"
    },

    initialize: function(){
      this.$el.hide();
    },

    searchHandler: function(event){
      Backbone.trigger('search', event, $("#task-search-form input").val());
    },

    render: function(){
      this.$el.show();
    },

    remove: function(){
      this.$el.hide();
    }
  });

  var TagSearchForm = Backbone.View.extend({
    el: "#tag-search-form",

    initialize: function(){
      this.$el.hide();
    },

    events: {
      "keyup input": "searchHandler"
    },

    render: function(){
      this.$el.show();
      /*
      $('#tag-search-form input').typeahead({
        name: 'tags',
        local: tagListView.tagNameArray
      }); */
      var self = this;
    },

    remove: function(){
      this.$el.hide();
    },

    searchHandler: function(event){
      Backbone.trigger('tagSearch', event, $("#tag-search-form input").val())
    }
  });


  // TASKS Models, Collections, Views

  var Task = Backbone.Model.extend({});

  var TaskView = Backbone.View.extend({
      className: 'task',
      template: "#task-template",

      initialize: function(){
        this.model.on('change', this.render());
      },

      render: function(){
          var template = TemplateCache.get(this.template)
          this.$el.html(template(this.model.toJSON()));
          return this;
      }
  });

  var TaskList = Backbone.Collection.extend({
      url: '/api/tasklist',

      initialize: function(){
        this.on('sync', this.createOriginal);
      },

      createOriginal: function(models){
        this.original = new Backbone.Collection(models.models);
      },

      parse: function(tasks){
          var self = this;
          _.each(tasks, function(task){
              var taskModel = new Task();
              taskModel.set({
                  name: task.name,
                  workspace: task.workspace.name,
                  assignee: task.assignee ? task.assignee.name : "Not assigned.",
                  completed_at: task.completed_at ? task.completed_at : "Not completed.",
                  created_at: task.created_at,
                  notes: task.notes ? task.notes : "No notes.",
                  project: task.projects ? task.projects[0].name : "Not in a project.",
                  href: task.projects ? task.projects[0].id + '/' + task.id : "#"
              });
              self.push(taskModel);
          });
          return this.models;
      }
  });

  var TaskListView = Backbone.View.extend({
      el: $("#task-view"),
      menuId: "#search",

      searchTasks: function(event, query){
        var self= this;
        var searchPattern = new RegExp(query,"gi");
        var searched = _.filter(this.collection.original.models, function(task){
          return searchPattern.test(task.get("name")) || searchPattern.test(task.get("assignee"));
        });
        this.collection.reset(searched);
        $(this.el).remove();
        self.render();
      },

      setWorkspaceFilter: function(event){
        this.filterWorkspace = event.currentTarget.value;
        Backbone.trigger("change:filterWorkspace");
      },

      getWorkspaces: function () {
        return _.uniq(this.collection.pluck("workspace"), false, function (workspace) {
          return workspace.toLowerCase();
        });
      },

      filterByWorkspace: function () {
        var filterWorkspace = this.filterWorkspace;
        var filtered = _.filter(this.collection.original.models, function (task) {
            return task.get("workspace").toLowerCase() === filterWorkspace;
        });
        this.collection.reset(filtered);
        this.render();
      },

      initialize: function(){
        var self = this;
        Backbone.on('selectChanged', this.setWorkspaceFilter, self);
        Backbone.on('search', this.searchTasks, self);
        Backbone.on("change:filterWorkspace", this.filterByWorkspace, self);
        this.on("render", $(this.el).show());          
        this.collection = new TaskList();
        this.collection.fetch({
          success: function(response, xhr){   
            self.taskFilterForm = new TaskFilterForm();
            self.taskSearchForm = new TaskSearchForm();
            Backbone.trigger('loaded');
          },
          error: function(error){
              console.log(error)
          }
        });
      },

      render: function(){
        this.taskViewArray = [];
        var self = this;
        var index = 0;
        var collectionLength = this.collection.models.length;
        self.renderProcess = function(){
          while(index < collectionLength){
            self.renderTask(self.collection.models[index]);
            index++;
            if (index % 20 == 0){
              setTimeout(function(){ self.renderProcess() }, 0);
              break;
            }
            if (index + 1 == collectionLength){
              $("#main-content").html(self.taskViewArray);
              break;

            }
          }
        }
        self.renderProcess();
      },

      renderTask: function(task){
        var taskView = new TaskView({
            model: task
        });
        this.taskViewArray.push(taskView.el)
      }
  });

  // TAGS Models, Collections, Views

  var Tag = Backbone.Model.extend({});

  var TagView = Backbone.View.extend({
      className: "tag",
      template: $("#tag-template").html(),

      initialize: function(){
          this.model.on('change', this.render());
      },

      render: function(){
          var tmpl = _.template(this.template);
          this.$el.html(tmpl(this.model.toJSON()));
          return this;
      }


  });

  var TagList = Backbone.Collection.extend({
      url: '/api/taglist',

      initialize: function(){
        this.on('sync', this.createOriginal);
      },

      createOriginal: function(models){
        console.log('createOriginal')
        this.original = new Backbone.Collection(models.models);
      },

      parse: function(tags){
          var self = this;
          _.each(tags, function(tag){
              var tagModel = new Tag();
              tagModel.set({
                  name: tag.name,
                  tasks: tag.tasks,
                  id: tag.id
              });
              self.push(tagModel);
          });
          return this.models;
      }
  });

  var TagListView = Backbone.View.extend({
      el: $("#tag-view"),
      menuId: "#tags",

      searchTags: function(event, query){
        var self = this;
        var searchPattern = new RegExp(query,"gi");
        var searched = _.filter(self.collection.original.models, function(tag){
          return searchPattern.test(tag.get("name"));
        });
        this.collection.reset(searched);
        $(this.el).remove();
        self.render();
      },

      initialize: function(){
        //$(this.el).html('');
        var self = this;
        Backbone.on('tagSearch', this.searchTags, self);
        this.collection = new TagList();
        this.collection.fetch({
          success: function(response, xhr){
            self.trigger('loaded');
            self.tagSearchForm = new TagSearchForm();
            self.tagNameArray = [];  // for use in typeahead
            self.collection.models.forEach(function(tag, index){
              self.tagNameArray.push(tag.get('name'));
            })
          }
        });
      },

      render: function(){
        this.tagViewArray = [];
        var self = this;
        _(this.collection.models).each(function(tag){
          self.renderTag(tag);
        }, this);
        $("#main-content").html(this.tagViewArray);

      },

      renderTag: function(tag){
          var tagView = new TagView({
              model: tag
          });
          this.tagViewArray.push(tagView.render().el);
      }
  });
  
  var App = _.extend({}, Backbone.Events);
  var tagListView = new TagListView();
  var taskListView = new TaskListView();
  $("#main-content").html('');
  var taskRouter = new TaskRouter();
  // Fix this: hack to prevent router from starting until loaded
  Backbone.on('loaded', function(){
      Backbone.history.start();
  })


})(jQuery);

