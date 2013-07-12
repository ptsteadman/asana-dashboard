var api = require('./api');

exports.index = function(req,res){
	res.render('index');
}

exports.updatedb = function(req, res){
	api.updatedb(req, res);
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
	}
}

exports.tests = function(req,res){
	res.render('tests');
}

exports.configure = function(req,res){
	res.render('configure');
}