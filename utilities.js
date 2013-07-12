var asana = require('asana-api');
var mongo = require('mongodb');
var AsanaProvider = require('./asanaprovider').AsanaProvider;
var utils = require('./utilities');

var ghost = new AsanaProvider('localhost', 27017);
var client = asana.createClient({
		apiKey: '1JeVS7kT.6gvqISqxpHUbzFUsLsaIHpa'
});


exports.getUser = function(users, id){
		var theUsers = (!users) ? [] : users;
		for(var i = 0; i< theUsers.length; i++){
			if (theUsers[i].id == id){
				 return theUsers[i].name;
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

exports.augmentTasks = function(tasks){
	ghost.findAllIn('userList', function(err, userList){
		ghost.findAllIn('taskList', function(err, tasks){
			for(var i = 0; i < tasks.length; i++){
				if (tasks[i].assignee) tasks[i].assignee.name = utils.getUser(userList, tasks[i].assignee.id);
			}
							console.log('augmented');
			ghost.save(tasks, 'taskList');
		});
	});
}