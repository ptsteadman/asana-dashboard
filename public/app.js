(function($) {

  // ROUTER 

var TaskRouter = Backbone.Router.extend({

      routes: {
          "":"home",
          "search/": "home",
          "search/:id" : "home",
          "tags/:id":"tags",
          "tags":"tags"
      },

      home: function(id){
          Presenter.showViews([taskListView, taskListView.searchForm, taskListView.taskFilterForm]);
          $("#search-form input").val(id);
          $("#search-form button").html("Search Tasks <span class='caret'></span>")
      },

      tags: function(id){
          Presenter.showViews([tagListView, taskListView.searchForm, tagListView.tagFilterForm]);
          $("#search-form input").val(id);
          $("#search-form button").html("Search Tags <span class='caret'></span>")
      }
  });

  // PRESENTER (simple class to show and hide arrays of views)
  // The 0th element in currentViewArray is the main view and needs to be toggled
  var Presenter = {
    showViews: function(viewArray){
      $('#main-content').html('<p style="text-align: center; margin-top: 15px;">Loading...</p>');
      if(this.currentViewArray){
        for (var i = 0; i < this.currentViewArray.length; i ++ ){
          this.currentViewArray[i].remove();
        }
      }
      this.currentViewArray = viewArray;
      for (var n = 0; n < this.currentViewArray.length; n ++ ){
        this.currentViewArray[n].render();
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

  var JSONFactory = {

    makeDict: function(attribute, taskList){
      var dict = new Array();
      for(var i = 0; i < taskList.length; i++){
        var task = taskList[i];
        if (!dict[task.get(attribute)]){
          dict[task.get(attribute)] = [task];
        } else {
          dict[task.get(attribute)].push(task);
        }
      }
      return dict;
    },

    getChild: function(children, name){
      for(var i = 0; i < children.length; i++){
        if(children[i].name == name){
          return children[i].children;
        }
      }
    },

    makeJSON: function(taskList){
      var json = {};
      json.name = "Workspaces";
      json.children = [];

      var workspaceDict = this.makeDict('workspace', taskList);

      for(workspace in workspaceDict){
        json.children.push({name: workspace, children: []})
        var projectDict = this.makeDict('project', workspaceDict[workspace]);
        for(project in projectDict){
          this.getChild(json.children, workspace).push({name: project, children: []})
          var headerDict = this.makeDict('priority_header', projectDict[project]);
          for(header in headerDict){
            this.getChild(this.getChild(json.children, workspace), project).push({name: header, value: headerDict[header].length, url: 'http://google.com'})
          }
        }
      }
     
      return json;
    }
  }

  // CONTROL FORMS (need to figure out how to create and destroy)

  var TagFilterForm = Backbone.View.extend({
    el: "#tag-filter-form",

    initialize: function(){
      this.$el.hide();
    },

    render: function(){
      this.$el.show();
      $("#tag-task-toggle").html("Search Tags <span class='caret'></span>");
    },

    remove: function(){
      this.$el.hide();
    }

  });

  var TaskFilterForm = Backbone.View.extend({
    el: "#task-filter-form",

    initialize: function(){
      $("#workspace-filter").append(this.createSelect());
      $("#workspace-filter select").attr("size",$("#workspace-filter select option").length);
      this.$el.hide();
    },

    events: {
      "change select": "selectHandler",
    },

    createSelect: function () {
      var select = $("<select multiple id='workspace-filter' class='form-control'><option>All</option></select>");

      _.each(taskListView.getUniques('workspace'), function (workspace) {
        var option = $("<option/>", {
          value: workspace.toLowerCase(),
          text: workspace
        }).appendTo(select);
      });
      return select;
    },

    selectHandler: function(event){
      Backbone.trigger('selectChanged', event);
    },

    render: function(){
      this.$el.show();
      $("#tag-task-toggle").html("Search Tasks <span class='caret'></span>");
    },

    remove: function(){
      this.$el.hide();
    }
  });

  var SearchForm = Backbone.View.extend({
    el: "#search-form",

    events: {
      "keyup input": "searchHandler"
    },

    initialize: function(){
      this.$el.hide();
      var self = this;
      setTimeout(function(){self.searchHandler()},0);
    },

    searchHandler: function(event){
      if($("#tag-task-toggle").text().substring(0,12) == "Search Tasks"){
        Backbone.trigger('search', event, $("#search-form input").val());
      } else {
        Backbone.trigger('searchTags', event, $("#search-form input").val());
      }
    },

    render: function(){
      this.$el.show();
    },

    remove: function(){
      this.$el.hide();
    }
  });

  // HOME View, shows the treemap 

  var Home = Backbone.View.extend({
      el: $("#home"),
      menuId: "#",

      render: function(root){
        $("#main-content").html('');
        $("#main-content").append("<h3 style='display: inline-block;'>Search for tasks up here</h3><img class='arrow' src='../arrow.png'></img>");

        $("#main-content").append("<h4 style='float: right; margin-top: 22px; margin-right: 10px;'>Tasks completed this week: <span class='text-success'> 32</span></h4><br /><br />");
        $("#main-content").append("<div id='chart'></div><br />")


        $('#chart').width($("#main-content").width());
        $('#chart').height()

        var margin = {top: 35, right: 0, bottom: 0, left: 0},
            width = $("#main-content").width(),
            height = 650 - margin.top - margin.bottom,
            formatNumber = d3.format(",d"),
            transitioning;

        var color = d3.scale.category20c();     

        var x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);

        var treemap = d3.layout.treemap()
            .children(function(d, depth) { return depth ? null : d.children; })
            .sort(function(a, b) { return a.value - b.value; })
            .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
            .round(false);

        var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

        var grandparent = svg.append("g")
            .attr("class", "grandparent");

        grandparent.append("rect")
            .attr("y", -margin.top)
            .attr("width", width)
            .attr("height", margin.top);

        grandparent.append("text")
            .attr("x", 6)
            .attr("y", 6 - margin.top)
            .attr("dy", "1em");

          initialize(root);
          accumulate(root);
          layout(root);
          display(root);

          function initialize(root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
            root.depth = 0;
          }

          // Aggregate the values for internal nodes. This is normally done by the
          // treemap layout, but not here because of our custom implementation.
          function accumulate(d) {
            return d.children
                ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
                : d.value;
          }

          // Compute the treemap layout recursively such that each group of siblings
          // uses the same size (1×1) rather than the dimensions of the parent cell.
          // This optimizes the layout for the current zoom state. Note that a wrapper
          // object is created for the parent node for each group of siblings so that
          // the parent’s dimensions are not discarded as we recurse. Since each group
          // of sibling was laid out in 1×1, we must rescale to fit using absolute
          // coordinates. This lets us use a viewport to zoom.
          function layout(d) {
            if (d.children) {
              treemap.nodes({children: d.children});
              d.children.forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c);
              });
            }
          }

          function display(d) {
            grandparent
                .datum(d.parent)
                .on("click", transition)
              .select("text")
                .text(name(d));

            grandparent.append("text")
                .attr("dx", "35em")
                .attr("dy", "-.6em")
                .text("[ Click here to zoom out ]");

            var g1 = svg.insert("g", ".grandparent")
                .datum(d)
                .attr("class", "depth");

            var g = g1.selectAll("g")
                .data(d.children)
              .enter().append("g");

            g.on('click',function(d){
                  window.open(d.url)
            })

            g.filter(function(d) { return d.children; })
                .classed("children", true)
                .on("click", transition);



            g.selectAll(".child")
                .data(function(d) { return d.children || [d]; })
              .enter().append("rect")
                .attr("class", "child")
                .call(rect)
                .style("fill", function(d) { 
                  if(d.name.charAt(d.name.length - 1) == ':'){
                    return d3.rgb(d.parent.color).brighter(d.parent.area * 2)
                  } 
                  else {
                    d.color = color(d.parent.name)
                    return color(d.parent.name) 
                  }
                });

            g.append("rect")
                .attr("class", "parent")
                .call(rect)
              .append("title")
                .text(function(d) { return formatNumber(d.value); });
                

            g.append("text")
                .attr("dy", ".75em")
                .text(function(d) { return d.name; })
                .call(text);

            g.append("text")
                .attr("dy", "2em")
                .text(function(d) { return formatNumber(d.value) + " tasks";})
                .call(text);


            function transition(d) {
              if (transitioning || !d) return;
              transitioning = true;


              var g2 = display(d),
                  t1 = g1.transition().duration(750),
                  t2 = g2.transition().duration(750);

              // Update the domain only after entering new elements.
              x.domain([d.x, d.x + d.dx]);
              y.domain([d.y, d.y + d.dy]);

              // Enable anti-aliasing during the transition.
              svg.style("shape-rendering", null);

              // Draw child nodes on top of parent nodes.
              svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

              // Fade-in entering text.
              g2.selectAll("text").style("fill-opacity", 0);

              // Transition to the new view.
              t1.selectAll("text").call(text).style("fill-opacity", 0);
              t2.selectAll("text").call(text).style("fill-opacity", 1);
              t1.selectAll("rect").call(rect);
              t2.selectAll("rect").call(rect);

              // Remove the old node when the transition is finished.
              t1.remove().each("end", function() {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
              });
            }

            return g;
          }

          function text(text) {
            text.attr("x", function(d) { return x(d.x) + 6; })
                .attr("y", function(d) { return y(d.y) + 6; });
          }

          function rect(rect) {
            rect.attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
                .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
          }

          function name(d) {
            return d.parent
                ? name(d.parent) + " -> " + d.name
                : d.name;
          }
      }
  })


  // TASKS Models, Collections, Views

  var Task = Backbone.Model.extend({});

  var TaskView = Backbone.View.extend({
      className: 'task',
      template: "#task-template",

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
        this.on('sync', this.createFiltered);
      },

      createOriginal: function(models){
        this.original = new Backbone.Collection(models.models);
      },

      createFiltered: function(models){
       this.filtered = new Backbone.Collection(models.models);
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
                  priority_header: task.priority_header ? task.priority_header : "Header not set.",
                  href: task.projects ? task.projects[0].id + '/' + task.id : "#"
              });
              self.push(taskModel);
          });
          return this.models;
      }
  });

  var TaskListView = Backbone.View.extend({
      menuId: "#search",

      searchTasks: function(event, query){
        document.location.hash = "search/" + query;
        var split = query.split(' ');
        split = _.map(split, function(word){
          return new RegExp(word, "gi")
        })
        var searched = _.filter(this.collection.filtered.models, function(task){
          for(var i = 0; i < split.length; i++){
            if(split[i].test(task.get('assignee'))){
              return true;
            }
            if (!split[i].test(task.get('name'))){
              return false;
            } 
          }
          return true;
        });
        this.collection.reset(searched);
        this.render();
      },

      getUniques: function(attribute){
        return _.uniq(this.collection.pluck(attribute), false, function (attribute) {
          return attribute;
        });
      },

      filter: function (event){
        this.workspaceFilters = $("select#workspace-filter").val() ? $("select#workspace-filter").val() : '' ;
        this.assignedFilter = $("select#assigned-filter").val() ? $("select#assigned-filter").val() : '';
        this.completedFilter = $("select#completed-filter").val() ? $("select#completed-filter").val() : '';
        this.workspaceAll = this.workspaceFilters ? this.workspaceFilters[0] : '';
        var self = this;
        var filtered = _.filter(this.collection.original.models, function(task){
          // WORKSPACES
          if(self.workspaceAll != 'All' && self.workspaceFilters != ''){
            var bool = false;
            for(var i = 0; i < self.workspaceFilters.length; i++){
              if (task.get("workspace").toLowerCase() == self.workspaceFilters[i]){
                bool = true;
              } 
            }
            if(!bool) return false;
          }
          // COMPLETED
          if ( self.completedFilter == "Completed Tasks"){
            if(task.get('completed_at') == "Not completed.") return false;
          }
          if ( self.completedFilter == "Incomplete Tasks"){
            if(task.get('completed_at') != "Not completed.") return false;
          }
          // ASSIGNED
          if ( self.assignedFilter == "Unassigned Tasks"){
            if(task.get('assignee') != "Not assigned.") return false;
          }
          if ( self.assignedFilter == "Assigned Tasks"){
            if(task.get('assignee') == "Not assigned.") return false;
          }

          return true;
        });
          this.collection.filtered.models = filtered;
          this.collection.reset(filtered);
          this.searchTasks(null, $("#search-form input").val());
      },

      initialize: function(){
        var self = this;
        Backbone.on('selectChanged', this.filter, self);
        Backbone.on('search', this.searchTasks, self);
        this.on("render", $(this.el).show());          
        this.collection = new TaskList();
        this.collection.fetch({
          success: function(response, xhr){   
            self.taskFilterForm = new TaskFilterForm();
            self.searchForm = new SearchForm();
            Backbone.trigger('loaded');
            $("#number-of-results").text(self.collection.models.length);
          },
          error: function(error){
              console.log(error)
          }
        });
      },

      // Render occurs after search and filters have selected a list of tasks: organizes
      render: function(){
        this.groupArray = [];  // groups pushed to here before they are all rendered
        var index = 0;
        var collectionLength = this.collection.models.length;
        var projectDict = new Array();
        if(collectionLength > 700){
          if($("#chart").length == 0){
            var json = this.collection.original ? JSONFactory.makeJSON(this.collection.original.models) : JSONFactory.makeJSON(this.collection.models);
            home.render(json);
        }
          $("#number-of-results").text(collectionLength);

        } else {
          for(var index = 0; index < collectionLength; index++){
            var task = this.collection.models[index];
            if (!projectDict[task.get('workspace') + '/' + task.get('project')]){
              projectDict[task.get('workspace') + '/' + task.get('project')] = [task];
            } else {
              projectDict[task.get('workspace') + '/' + task.get('project')].push(task);
            }
          }

          for(project in projectDict){
            this.renderGroup(projectDict[project]);
          }
          $("#main-content").html(this.groupArray);
          $("#number-of-results").text(collectionLength);
      }
      },

      renderGroup: function(projectGroup){
        var projectGroup = new ProjectGroupView({
          model: projectGroup
        });
        this.groupArray.push(projectGroup.el);
      }
  });

  var ProjectGroupView = Backbone.View.extend({
      className: 'panel panel-primary',

      initialize: function(){
        this.render();
      },

      render: function(){
        this.headerGroupArray = [];
        var headerDict = new Array();
        for(var index = 0; index < this.model.length; index++){
          var task = this.model[index];

          if (!headerDict[task.get('priority_header')]){
            headerDict[task.get('priority_header')] = [task];
          } else {
            headerDict[task.get('priority_header')].push(task);
          }
        }
        for(header in headerDict){
          this.renderHeaderGroup(headerDict[header]);
        }

        var header = this.model[0] ? "<strong>" + this.model[0].get('workspace') + "</strong>: " + this.model[0].get('project')  : 'No header.';
        var headerHTML = "<div class='panel-heading'><h3 class='panel-title'> <i class='icon icon-folder-open'></i> " + header + "</div></div>"
        $(this.el).append(headerHTML);
        $(this.el).append(this.headerGroupArray)
      },

      renderHeaderGroup: function(tasks){
        var headerGroup = new HeaderGroupView({
            model: tasks
        });
        this.headerGroupArray.push(headerGroup.el);
      }

  });

  var HeaderGroupView = Backbone.View.extend({
    className: 'panel panel-priority-header',

    initialize: function(){
      this.render();
    },

    render: function(){
      this.taskGroupArray = [];
      for(var index = 0; index < this.model.length; index++){
        this.taskGroupArray.push(this.renderTask(this.model[index]));
      }
      var header = this.model[0] ? this.model[0].get('priority_header') : 'Not under a header.';
      var headerHTML = "<div class='panel-heading'><strong>" + header + "</strong></div>"
      $(this.el).append(headerHTML);
      $(this.el).append(this.taskGroupArray);
    },

    renderTask: function(task){
      var taskView = new TaskView({
        model: task
      });
        return taskView.render().el;
      }
  })

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

      searchTags: function(event, query){
        document.location.hash = "tags/" + query;
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
        Backbone.on('searchTags', this.searchTags, self);
        this.collection = new TagList();
        this.collection.fetch({
          success: function(response, xhr){
            self.trigger('loaded');
            self.tagFilterForm = new TagFilterForm();
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
        $("#number-of-results").text(this.tagViewArray.length)

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
  var home = new Home();
  $("#main-content").html('');
  var taskRouter = new TaskRouter();
  // Fix this: hack to prevent router from starting until loaded
  Backbone.on('loaded', function(){
      Backbone.history.start();
  })


})(jQuery);

