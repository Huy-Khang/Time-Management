var mongo = require('mongodb');
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var dbName  = 'time-manager';

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db(dbName, server);
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to "+ dbName +" database");
        db.collection('tasks', {strict:true}, function(err, collection) {
            populateDB();
            if (err) {
                console.log("The 'tasks' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});
 
exports.findById = function(req, res, callback) {
    var id = req.params.id;
    console.log('Retrieving task: ' + id);
    db.collection('tasks', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 
exports.findAll = function(req, res) {
    db.collection('tasks', function(err, collection) {
        if(req.query.projectId!=null){
            collection.find({projectId: req.query.projectId}).sort({start: -1}).toArray(function(err,item){
                res.send(item);
            });
        }
        else{
            collection.find(
                {$or:[{projectId : req.query.projectId}
                    ,{userId:req.query.id}]}).sort({start: -1}).skip(req.query.ipage*7).limit(7).toArray(function(err, items) {
                res.send(items);
            });    
        }
        
    });
};
 
exports.addTask = function(req, res) {
    var task = req.body.task;
    task.start = Date(task.start);
    console.log('Adding task: ' + JSON.stringify(task));
    db.collection('tasks', function(err, collection) {
        collection.insert(task, {upsert:true,safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(JSON.stringify(result[0]));
            }
        });
    });
}
 
exports.updateTask = function(req, res) {
    var id = req.params.id;
    var task = req.body.task;
    // console.log('Updating task: ' + id);
    // console.log(JSON.stringify(task));
    console.log(task);
    var upPro = {
        _id: new BSON.ObjectID(id)
        ,name: task.name
        ,projectId: task.projectId
        ,userId: task.userId
        ,start: Date(task.start)
        ,end: Date(task.end)
        ,duration: task.duration
    };
    db.collection('tasks', function(err, collection) {
        collection.update({'_id': new BSON.ObjectID(id)}, upPro, {safe: true}, function(err, result) {
            // collection.update(task, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating task: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(task);
            }
        });
    });
}

exports.deleteTasks = function(req, res) {
    console.log(req.params.projectId);
    db.collection('tasks', function(err, collection) {
        collection.remove({projectId: req.params.projectId}, function(err,result){
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.deleteAll = function(req, res) {
    db.collection('tasks', function(err, collection) {
        collection.remove({}, function(err,result){
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.deleteTask = function(req, res) {
    var id = req.params.id;
    console.log('Deleting task: ' + id);
    db.collection('tasks', function(err, collection) {
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
 
    var tasks = [
    {
        name: '',
        projectId: '',
        userId: '',
        start: '',
        end: '',
        duration:''
    }];
};