var site = {
	init : function(){
		site.callAPI("completed").done(function(data){
			site.fillCompletedTable(data);
		})
		site.callAPI("currentSprint").done(function(data){
			site.fillSprintTable(data);
		});
		site.callAPI("taglist").done(function(data){
			site.displayTags(data);
		});
		site.callAPI("taskListLength").done(function(data){
			$("#totalNo").text(data);
		})
		site.addEventListeners();
		site.showSection("#home");
	},

	callAPI : function(param, qs){
		qs = undefined ? qs = "": qs = qs;
		return $.ajax({
			url: '/api/' + param + '/?qs=' + qs,
				type: 'GET'
		});
	},

	addEventListeners : function(){
		$('#hideCompleted').click(function() {
    var $this = $(this);
    // $this will contain a reference to the checkbox   
    if ($this.is(':checked')) {
        $(".success").hide();
    } else {
        $(".success").show();
    }
		});
		site.navHandler();
	},

	displayTags : function(tags){
		var tagsArray = [];
		tags.forEach(function(tag, index){
			taskArray = [];
			var tasks = tag.tasks;
			tasks.forEach(function(task,index){
				taskArray.push("<p>" + task.name + "</p>");
			});

			tagsArray.push("<div class='accordion-group'> \
    									<div class='accordion-heading'> \
      									<a class='accordion-toggle' data-toggle='collapse' data-parent='#accordionTags' href='#collapse" + tag.id + "'> \
       									<strong> " + tag.name + "</strong>  </a><p style='float:right; padding-right: 25px; margin-top: -25px;'>Number of Tasks: " + taskArray.length + "</p>\
    									</div> \
    									<div id='collapse" + tag.id + "' class='accordion-body collapse'> \
      									<div class='accordion-inner'> \
       									 	<div id='tasks" + tag.id + "'> \
       									 	" + taskArray.join("") + " \
       									 	</div> \
      									</div> \
    									</div> \
  									</div>");
		});
		$(".accordion").html(tagsArray.join(""));
	},


	fillSprintTable: function(data){
		var taskArray = [];
		taskArray.push("<thead><tr><th>Task Name</th><th>Task Owner</th><th>Completed?</th></tr></thead><tbody>");
		data.forEach(function(task, index){
			var trClass = task.completed_at ? "success" : "";
			var icon = task.completed_at ? "<i class='icon-ok'></i> " : "";
			var assignee = task.assignee ? task.assignee.id : "Not assigned.";
			var completed = task.completed_at ? task.completed_at.substring(0,10) : "Not completed."
			taskArray.push("<tr class='" + trClass + "'><td><em>" + icon + task.name + "</em></td><td>" + assignee + "</td><td>" + completed + "</td></tr>");
		});
		taskArray.push("</tbody>");
		console.log(taskArray.join(""));
		$("#sprintTasks").html(taskArray.join(""));
		$(".success").hide();
	},

	fillCompletedTable: function(data){
		var taskArray = [];
		taskArray.push("<thead><tr><th>Task Name</th><th>Task Owner</th><th>Completed?</th></tr></thead><tbody>");
		data.forEach(function(task, index){
			var trClass = task.completed_at ? "success" : "";
			var icon = task.completed_at ? "<i class='icon-ok'></i> " : "";
			var assignee = task.assignee ? task.assignee.id : "Not assigned.";
			var completed = task.completed_at ? task.completed_at.substring(0,10) : "Not completed."
			taskArray.push("<tr><td><em>" + icon + task.name + "</em></td><td>" + assignee + "</td><td>" + completed + "</td></tr>");
		});
		taskArray.push("</tbody>");
		console.log(taskArray.join(""));
		$("#completedTasks").html(taskArray.join(""));
		$("#completedTasks").tablesorter({sortList: [[2,1]]});
		$("#completedNo").text(taskArray.length - 2);
	},

	fillTagTable: function(data){
		var tagArray = [];
		tagArray.push("<thead><tr><th>Tag Name</th><th>ID</th></tr></thead><tbody>");
		data.forEach(function(tag, index){
			tagArray.push("<tr><td>" + tag.name + "</td><td>" + tag.id + "</td></tr>");
		});
		tagArray.push("</tbody>");
		console.log(tagArray.join(""));
		$("#tagTable").html(tagArray.join(""));
	},

	showSection: function(id){
		$("section").hide();
		$(id).fadeIn();
	},

	navHandler: function(){
		$("#sidebar-nav a").click(function(){
			site.showSection($(this).attr("href"));
		})
		$("#sidebar-nav li").click(function(){
			$("#sidebar-nav li").removeClass("active");
			$(this).addClass("active");
		})
	}

}

$(function(){site.init()});  

