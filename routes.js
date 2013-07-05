var asana = require('asana-api');

exports.index = function(req,res){
	res.render('index');
}

exports.api = function(req,res){
	var client = asana.createClient({
		apiKey: '1JeVS7kT.6gvqISqxpHUbzFUsLsaIHpa'
	});
	var call = req.params.call;
	var query = req.query.qs;

	switch (call){
		case "projectslist":
			client.projects.list(function(err, projects){
				res.json(projects);	
			});
			break;
		case "tasklist":
			client.projects.tasks(query, function(err, tasks){
				res.json(tasks);
			});
			break;
		case "completed":
		//PRACTICE WRITING ASYNC LOOP
			var taskArray = [];
			var p = 0;
			var t = 0;
			client.projects.list(function(err, projects){
				projectLoop();
				function projectLoop() {
					if(p < projects.length){
						client.projects.tasks(projects[p].id, function(err, tasks){
							t = 0;
							taskLoop(tasks);
						});
					} else {
						res.json(taskArray);
					}
				}
				function taskLoop(tasks){
					if(t < tasks.length){
						console.log(tasks[t]);
						taskArray.push(tasks[t]);
						t++;
						setTimeout(taskLoop(tasks), 0);  //CONTINUE ITERATING PROJECT'S TASKS
					} else {
						p++;
						setTimeout(projectLoop,0);  //GO TO NEXT PROJECT
					}
			}
			});
			break;
		case "workspaces":
			client.workspaces.list(function(err,data){
				console.log(data);
			});
			break;
		case "workspace":
			client.workspaces.tasks(query, function(err,data){
				console.log(data);
				console.log(err);
				res.json(data);
			});
			break;

	}
}

exports.tests = function(req,res){
	res.render('tests');
}