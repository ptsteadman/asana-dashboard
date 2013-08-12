var asana = require('asana-api');
var mongo = require('mongodb');
var AsanaProvider = require('./asanaprovider').AsanaProvider;
var utils = require('./utilities');
var async = require('async');


var ghost = new AsanaProvider('localhost', 27017);
var client = asana.createClient({
		apiKey: '1Pjl79Np.wMQCNmrfCJSud3WBef3w87s'
});

//CREATE

exports.testIt = function(req, res){
	console.log('test');
	res.send('test');
}

exports.updatedb = function(req, res){
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
						if (error) console.log(error)
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
		//SYNCED TASKS
		function(callback){
			ghost.remove('taskList');
			ghost.findAllIn('projectList', function(error, projects){
				async.forEach(projects, function(project, callback){
					client.projects.verboseTasks(project.id, function(error, tasks){
						console.log('Saving bare tasks for ' + project.name);
						ghost.saveMultiple(tasks, 'taskList', callback);
					});
				}, function(error){
						if (error) console.log(error);
						console.log('All bare tasks saved.')
						callback();
					});
			});
		},
		function(callback){
			utils.augmentTasks(callback);
		},
		function(callback){
			utils.augmentTags(callback);
		}
		], function(err){
			console.log("DONE!!!!!");
			console.log(err)
			var done = new Date();
			res.send("Asana ghost DB updated in " + ((done.getTime() - start.getTime())/1000) + " secs.");
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


exports.currentSprint = function(req, res){
			ghost.findById(4902526581434,'taskList', function(error, tasks){
				ghost.findAllIn('userList', function(err, users){
				taskArray = [];
				var sprintStart = false;
				var sprintEnd = false;
				if (error){
					return res.json('');
				}
				for(var i=0;i<tasks.length;i++){
					if(tasks[i].name == "CURRENT SPRINT:"){
						sprintStart = true;
					} else {
					if(sprintStart){
						if(tasks[i].name == "FOR TRIAGE:"){
							sprintEnd = true;
						} else if (!sprintEnd) {
							taskArray.push(tasks[i]);							
						}
					}
				}
				}
				res.json(taskArray);
			});
			});
}

exports.getTrackedTags = function(req, res){
	ghost.findAllIn('trackedTagArray', function(err, tags){
		res.json(tags);
	});
}

exports.postTrackedTags = function(req, res){
	console.log(req.body);
	var updatedArray = req.body;
	ghost.remove('trackedTagArray');
	ghost.saveMultiple(updatedArray, 'trackedTagArray', function(data){
		console.log('trackedTags updated');
		res.send(200);
	});
}



