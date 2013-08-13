var api = require('./api');
var utils = require('./utilities')

exports.index = function(req,res){
	res.render('index.html');
}

exports.updatedb = function(req, res){
	api.updatedb();
	res.send("Database should update.");
}

exports.api = function(req,res){
	var call = req.params.call;
	var query = req.query.qs;

	switch (call){
		case "tasklist":
			api.tasklist(req, res);
			break;
		case "userlist":
			api.userlist(req, res);
			break;
		case "completed":
			api.completed(req, res);
			break;
		case "currentSprint":
			api.currentSprint(req, res);
			break;
		case "taglist":
			api.taglist(req, res);
			break;
		case "taskListLength":
			api.taskListLength(req, res);
			break;
		case "augment":
			utils.augmentTasks(function(){
				res.send("Augmented!");
			});
			break;
		case "trackedtags":
			api.getTrackedTags(req, res);
			break;
	}
}

exports.postapi = function(req, res){
	var call = req.params.call;

	switch (call){
		case "trackedtags":
			api.postTrackedTags(req, res);
			break;
	}
}

exports.tests = function(req,res){
	api.testIt(req, res);
}

exports.configure = function(req,res){
	res.render('configure');
}
