var mongo = require('mongodb');
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var dbName  = 'time-manager';

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db(dbName, server);
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to " + dbName +" database");
        db.collection('projects', {strict:true}, function(err, collection) {
            populateDB();
            if (err) {
                console.log("The 'projects' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});

exports.findById = function(req, res, callback) {
    var id = req.params.id;
    // console.log('Retrieving project: ' + id);
    db.collection('projects', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 
exports.findAll = function(req, res) {
    db.collection('projects', function(err, collection) {
        collection.find({userId:req.session.user._id}).toArray(function(err, items) {
            // console.log(items);
            res.send(items);
            // callback(items);
        });
    });
};
 
exports.addProject = function(req, res) {
    var project = req.body.project;
    // console.log('Adding project: ' + JSON.stringify(project));
    db.collection('projects', function(err, collection) {
        collection.insert(project, {upsert:true,safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                // console.log('Success: ' + JSON.stringify(result[0]));
                res.send(JSON.stringify(result[0]));
            }
        });
    });
}

exports.updateProject = function(req, res) {
    var id = req.params.id;
    var project = req.body.project;
    // console.log('Updating project: ' + id);
    // console.log(JSON.stringify(project));
    // console.log(project);
    var upPro = {
        _id: new BSON.ObjectID(id)
        ,name: project.name
        ,totalTime: project.totalTime
        ,userId: project.userId
        ,isRun: project.isRun
        ,time: project.time
    };
    db.collection('projects', function(err, collection) {
        collection.update({'_id': new BSON.ObjectID(id)}, upPro, {safe: true}, function(err, result) {
            // collection.update(project, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating project: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                // console.log('' + result + ' document(s) updated');
                res.send(project);
            }
        });
    });
}

exports.deleteProject = function(req, res) {
    var id = req.params.id;
    // console.log('Deleting project: ' + id);
    db.collection('projects', function(err, collection) {
        collection.remove({'_id': new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            // collection.remove({code: '333333'}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}
var populateDB = function() {
 
    var projects = [
    {
        name: 'Khang',
        totalTime: '',
        userId: 'dsfsdfs',
        isRun: false,
        time: Date()
    }];
};
 