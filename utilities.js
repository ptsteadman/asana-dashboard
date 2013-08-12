var asana = require('asana-api');
var mongo = require('mongodb');
var AsanaProvider = require('./asanaprovider').AsanaProvider;
var utils = require('./utilities');
var async = require('async');

var ghost = new AsanaProvider('localhost', 27017);
var client = asana.createClient({
		apiKey: '1Pjl79Np.wMQCNmrfCJSud3WBef3w87s'
});


exports.getUser = function(users,id){
		for(var i = 0; i< users.length; i++){
			if (users[i].id == id){
				 return users[i].name;
			}
		}
		return null;
}

exports.getWorkspace = function(workspaces, id){
		for(var i = 0; i< workspaces.length; i++){
			if (workspaces[i].id == id){
				 return workspaces[i].name;
			}
		}
		return null;
}

exports.getProject = function(projects, id){
		for(var i = 0; i< projects.length; i++){
			if (projects[i].id == id){
				 return projects[i].name;
			}
		}
		return null;
}

exports.withinWeek = function(date){
	if (!date) return false;
	var taskDate = new Date(date);
	var now = new Date();
	if (now.getTime() - taskDate.getTime() < (7*1000*60*60*24)) return true;
	return false;
}

exports.augmentTasks = function(callback){
	ghost.findAllIn('workspaceList', function(err, workspaces){
		ghost.findAllIn('userList', function(err, users){
			ghost.findAllIn('projectList', function(err, projects){
				ghost.findAllIn('taskList', function(err, tasks){
						for(var i = 0; i < tasks.length; i++){
							if (tasks[i].assignee) tasks[i].assignee.name = utils.getUser(users, tasks[i].assignee.id);
							if (tasks[i].workspace) tasks[i].workspace.name = utils.getWorkspace(workspaces, tasks[i].workspace.id);
							if (tasks[i].projects[0]) tasks[i].projects[0].name = utils.getProject(projects, tasks[i].projects[0].id);
						}
						ghost.save(tasks, 'taskList');
						console.log('Tasks Augmented.');
						callback();
				});
			});
		});	
	});
}

exports.augmentTags = function(callback){
	ghost.findAllIn('tagList', function(err, tags){
		async.forEach(tags, function(tag, callback){
			client.tags.tasks(tag.id, function(error, tasks){
				tag.tasks = tasks;
				callback();
			}, callback);
		}, function(){
			ghost.save(tags, 'tagList');
			console.log('Tags Augmented.');
			callback();
		})
	});
}