var site = {
	init : function(){
		site.callAPI("projectslist").done(function(data){
			site.displayProjects(data);
		})
		/*site.callAPI("completed").done(function(data){
			console.log(data);
		})*/
		site.callAPI("workspaces").done(function(data){
			console.log(data);
		});
		site.callAPI("workspace","498346170860").done(function(data){
			console.log(data);
		})

	},

	callAPI : function(param, qs){
		qs = undefined ? qs = "": qs = qs;
		return $.ajax({
			url: '/api/' + param + '/?qs=' + qs,
				type: 'GET'
		});
	},

	displayProjects : function(projects){
		var projectsArray = [];
		projects.forEach(function(project, index){
			projectsArray.push("<div class='accordion-group'> \
    									<div class='accordion-heading'> \
      									<a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion2' href='#collapse" + project.id + "'> \
       									" + project.name + " \
      									</a> \
    									</div> \
    									<div id='collapse" + project.id + "' class='accordion-body collapse'> \
      									<div class='accordion-inner'> \
       									 	<div id='tasks" + project.id + "'></div> \
      									</div> \
    									</div> \
  									</div>");
		});
		$(".accordion").html(projectsArray.join(""));
		site.displayTasks(projects);
	},

	displayTasks: function(data){
		data.forEach(function(project, index){
			site.callAPI("tasklist", project.id).done(function(tasks){
				var tasksArray = [];
				tasks.forEach(function(task, index){
					tasksArray.push("<p>" + task.name + "</p>");
				});
				console.log(project.id);
				$("#tasks" + project.id).html(tasksArray.join(""));
			});
		});
	}

}

$(function(){site.init()});  

