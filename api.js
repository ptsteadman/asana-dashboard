var asana = require('asana-api');
var mongo = require('mongodb');
var AsanaProvider = require('./asanaprovider').AsanaProvider;
var utils = require('./utilities');
var async = require('async');
var cronJob = require('cron').CronJob;


// Controls when app updates chache
new cronJob('0 0 * * * *', function(){
    exports.updatedb();  
}, null, true, "America/New_York");


// API key of asana-dashboard@priceline.com
var ghost = new AsanaProvider('localhost', 27017);
var client = asana.createClient({
		apiKey: '23WBqq2D.ZGmDolbvXWotOFTX1jJG7w8'
});

//CREATE

exports.testIt = function(req, res){
	console.log('test');
	res.send('test');
}

exports.updatedb = function(){
	console.log(client);
	console.log('updating');
	var start = new Date();
	async.series([
		function(callback){
			//PARALLEL TASKS
			async.parallel([
				//save USERS to ghost
				function(callback){
					client.users.list(function(error, users){
						if (error) console.log(error + "userlist")
						if (error) return callback(error);
						ghost.remove('userList');
						ghost.saveMultiple(users, 'userList', function(data){
							console.log('users updated');
							callback();  //done
						});
					});
				},
				//save WORKSPACES to ghost
				function(callback){
					client.workspaces.list(function(error, workspaces){
						if (error) return callback(error);
						ghost.remove('workspaceList');
						ghost.saveMultiple(workspaces, 'workspaceList', function(data){
							console.log('workspaces updated');
							callback();  //done
						});
					});
				},
				//save TAGS to ghost
				function(callback){
					client.tags.list(function(error, tags){
						if (error) return callback(error);
						ghost.remove('tagList');
						ghost.saveMultiple(tags, 'tagList', function(data){
							console.log('tags updated');
							callback();  //done
						});
					});
				},
				//save PROJECTS to ghost
				function(callback){
					client.projects.list(function(error, projects){
						if (error) return callback(error);
						ghost.remove('projectList');
						ghost.saveMultiple(projects, 'projectList', function(data){
							console.log('projects updated');
							callback();  //done
						});
					});
				}
				], callback);  //PARALLEL TASKS DONE
		},
		//SERIES TASKS
		function(callback){  // CALLS ASANA API AND GETS TASKS FOR ALL PROJECTS
			ghost.remove('taskList');
			ghost.findAllIn('projectList', function(error, projects){
				async.forEach(projects, function(project, callback){
					client.projects.verboseTasks(project.id, function(error, tasks){
						console.log('Saving verbose tasks for ' + project.name);
						utils.setPriorityHeaders(tasks, function(tasksWithPriorityHeaders){
							ghost.saveMultiple(tasksWithPriorityHeaders, 'taskList', callback);
						});
					});
				}, function(error){
						if (error) console.log(error+ "findingTasksError");
						console.log('All verbose tasks saved.')
						callback();
					});
			});
		},
		function(callback){
			// Converts project and user id's into human readable names
			utils.augmentTasks(callback);
		},
		function(callback){
			// Makes API calls to get lists of tasks for each tag, and then replaces the list with detailed tasks (kind of inefficient but...)
			utils.augmentTags(callback);
		}
		], function(err){
			console.log("DONE!!!!!");
			var done = new Date();
			console.log("Asana ghost DB updated in " + ((done.getTime() - start.getTime())/1000) + " secs.");
	})
}

//RETREIVE

exports.tasklist = function(req, res){
	ghost.findAllIn('taskList', function(err, tasks){
		res.json(tasks);
	});
}

exports.taskListLength = function(req, res){
	ghost.findAllIn('taskList', function(err, tasks){
		res.json(tasks.length);
	});

}

exports.userlist = function(req, res){
	ghost.findAllIn('userList', function(err, tasks){
		res.json(tasks);
	});
}

exports.taglist = function(req, res){
	ghost.findAllIn('tagList', function(error, tags){
		res.json(tags);
	});
}

exports.completed = function(req, res){
	ghost.findAllIn('taskList', function(err, tasks){
		var completedTasks = [];
			for(var i = 0; i < tasks.length; i++){
				(function(n){
					if (utils.withinWeek(tasks[n].completed_at)) completedTasks.push(tasks[n]);
					})(i)
				}
		res.json(completedTasks);
	});
}