var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

AsanaProvider = function(host, port) {
	this.db = new Db('ghost', new Server(host, port), {safe: false}, {auto_reconnect: true}, {});
	console.log('Connected to Asana Ghost MongoDB.')
	this.db.open(function(){});
}

AsanaProvider.prototype.getCollection = function(collectionName, callback){
	this.db.collection(collectionName, function(error, theCollection){
		if (error) callback(error);
		else callback(null, theCollection);
	});
}

AsanaProvider.prototype.findAllIn = function(collectionName, callback){
	this.getCollection(collectionName, function(error, theCollection){
		if (error) callback(error);
		else {
			theCollection.find().toArray(function(error, results){
				if (error) callback(error);
				else callback(null, results);
			});
		}
	});
}

AsanaProvider.prototype.save = function(datas, collectionName){
	this.getCollection(collectionName, function(error, theCollection){
		theCollection.remove();
		if (error) callback(error);
		else {
			if(typeof(datas.length)=="undefined"){ datas = [datas]}
			theCollection.insert(datas);
		}
	});
}

AsanaProvider.prototype.saveMultiple = function(datas, collectionName, callback){
	this.getCollection(collectionName, function(error, theCollection){
		if (error) callback(error);
		else {
			if (!datas) return callback();
			if(typeof(datas.length)=="undefined"){ datas = [datas]}
			theCollection.insert(datas);
			callback();
		}
	});
}

AsanaProvider.prototype.findById = function(theId, collectionName, callback) {
    this.getCollection(collectionName, function(error, theCollection) {
      if( error ) callback(error);
      else {
        theCollection.find({projects: { $elemMatch : { 'id': theId } }}).toArray(function(error, result) {
          if( error ){
          	console.log('error!')
          	callback(error);
          } 
          else {
          	callback(null, result)
          }
        });
      }
    });
};

AsanaProvider.prototype.remove = function(collectionName){
	this.getCollection(collectionName, function(error, theCollection){
		theCollection.remove();
	});
}

exports.AsanaProvider = AsanaProvider;