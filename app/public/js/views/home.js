(function(){

	var app = angular.module('user',['ui.bootstrap','infinite-scroll','googlechart']);

	app.factory('shareService',function($rootScope){
		var shareService = {};
		shareService.projectId = null;

		shareService.reInit = function(){
			$rootScope.$broadcast('reInit');
		};

		shareService.projectTotalTime = function(id){
			console.log(id);
			shareService.projectId = id;
			$rootScope.$broadcast('projectTotalTime');
		};

		shareService.deleteRelativeTasks = function(id){
			console.log(id);
			shareService.projectId = id;
			$rootScope.$broadcast('deleteRelativeTasks');
		};

		return shareService;
	});

	app.controller('TabsDemoCtrl',['$scope',function($scope){
		
	}]);

	app.controller('ReportController',['$scope','$http',function($scope,$http){
		$scope.Projects = [];
		$scope.projectId = null;
		$scope.chartPieObject=null;
		$scope.chartColumnObject=null;
		$scope.rows=[];


		this.init = function(){
			$http.get('/projects').success(function(data){
				$scope.Projects = data;
			});
		};

		this.columnChart = function(){
			var rows=[];
			var cols=[{
				        "id": "day",
				        "label": "Day",
				        "type": "string",
				        "p": {}
				      }];
			$http.get('/task',{params:{projectId: $scope.projectId._id}}).success(function(data){
				data.forEach(function(item){
					item.start = moment(item.start).format('dddd, MMMM Do YYYY');
					cols.push({
						"id":item.name,
						"label":item.name,
						"type":"number",
					})
				});

				var array = [];

				for(var i = 0;i<data.length;i++){
					if(data[i]!=null){
						var temp=[];
						temp.push({"v":data[i].start});
						for(var k = 1;k < cols.length;k++){
							temp.push({"taskName":cols[k].label});
						}
						for(var j=0;j<data.length;j++){
							if(data[j]!=null){
								if(temp[0].v == data[j].start){
									for(var k=1;k<temp.length;k++)
									{
										if(temp[k].taskName == data[j].name){
											temp[k] ={
												"v": moment.duration(data[j].duration).asMilliseconds()
												,"f":data[j].duration
												,"taskName": data[j].name		
											}; 
										}
									}
									data[j]=null;
								}
							}
						}
						array.push(temp);
					}
				}
				array.forEach(function(item){
					rows.push({"c":item});
				});
				$scope.chartColumnObject = {
				  "type": "BarChart",
				  "displayed": true,
				  "data": {
				    "cols": cols,
				    "rows": rows,
				   },
				   "options":{
					   	"vAxis": {
					      "title": "Date",
					      "gridlines": {
					        "count": 10
					      }
					    },
					    "hAxis": {
					      "title": "Duration as Millisecond"
					    }
				   }
				}

			});
		};
		this.pieChart = function(){
			$http.get('/projects').success(function(data){
				$scope.rows=[];
				data.forEach(function(item){
					$scope.rows.push({"c":[
						{
							"v":item.name
						},
						{
							"v":moment.duration(item.totalTime).asMilliseconds(),
							"f":item.totalTime
						}
					]});
				});
				$scope.chartPieObject = {
				  "type": "PieChart",
				  "displayed": true,
				  "data": {
				    "cols": [
				      {
				        "id": "project",
				        "label": "Project",
				        "type": "string",
				        "p": {}
				      },
				      {
				        "id": "duration",
				        "label": "Duration",
				        "type": "number"
				      }
				    ],
				    "rows": $scope.rows
				  }
				}
			});
		};
		
	}]);

	app.controller('TaskController',['$http','$interval','$timeout','$scope','shareService',function($http,$interval,$timeout,$scope,shareService){
		var task = this;
		task.userId = '';
		task.Tasks=[];
		task.Projects=[];
		task.runningTask = null;
		task.newTask = null;
		task.intervalObject = null;
		task.duration = '0s';

		$scope.$on('reInit',function(){
			task.init();
		});

		$scope.$on('deleteRelativeTasks',function(){
			task.deleteTasks(shareService.projectId);
		});

		this.init = function(){
			$http.get('/user').success(function(data){
				// console.log(data);
				task.userId = data._id;
				$http.get('/projects').success(function(data){
					task.Projects = data;
				});
			});
		};

		this.deleteTasks = function(id){
			console.log(id);
			$http.delete('/task/' + id ).success(function(){
				task.init();
				task.Tasks=[];
				task.getTasks();
			});
		};

		this.test = function(){
			$http.delete('/task/all').success(function(data){
				console.log(data);
			});
		};

		this.startTimer = function(){

			// var start = moment(task.runningTask.start,['dddd, MMMM Do YYYY, h:mm:ss a']);//.format('dddd, MMMM Do YYYY, h:mm:ss a');
			var start = moment(task.runningTask.start);
			var now = moment();
			// var ms = moment(now).diff(moment(start));
			var ms = now.diff(start);

			// console.log(ms);

			var d = moment.duration(ms);

			task.intervalObject = $interval(function(){
				d.add({'s':1})

				var h = moment.duration( d.asMilliseconds()-(d.asMilliseconds() % (3600*1000)));
				var m = moment.duration( d.asMilliseconds() % (3600*1000) );
				var s = moment.duration( d.asMilliseconds() );
				task.duration = h.asHours() + ':' + m.minutes() + ':' + s.seconds();

				// task.duration = d.hours() + ':' + d.minutes() + ':' + d.seconds();
			},1000);
		};

// ;
// 			$http.get('/task/' + task.userId,{
// 				params:{ id:task.userId,
// 						ipage: 1}
// 				})

		this.getTasks = function(){
			$timeout(function(){
				$http({
					url:'/task'
					,method:'GET'
					,params:{
						id: task.userId
						,ipage: task.Tasks.length / 7 
					}
				}).success(function(data){
					for(var i=0;i<data.length;i++){
						task.Projects.forEach(function(item){
							if(item._id == data[i].projectId){
								data[i].projectId = item;
							}
						})
						task.Tasks.push(data[i]);
					}

					data.forEach(function(item){
						if(item.end==null){
							task.runningTask = item;
							task.startTimer();
						}
					});
				});
			},0000);
			
		};

		this.startTask = function(){
			var nTask = {
				name: task.newTask.name
				,projectId: task.newTask.project._id
				,userId: task.userId
				,start: Date()
				,end: null
				,duration: '00:00:00'
			};

			$http.post('/task',{task: nTask}).success(function(data){
				task.newTask = null;
				task.Tasks = [];
				task.getTasks();
			});
		};

		this.calDuration = function(start,end){

			var start = moment(start);
			var end = moment(end);
			var ms = end.diff(start);

			var h = moment.duration( ms-(ms % (3600*1000)));
			var m = moment.duration( ms % (3600*1000) );
			var s = moment.duration( ms );
			return h.asHours() + ':' + m.minutes() + ':' + s.seconds();
		};

		this.stopTask = function(){
			task.runningTask.projectId = task.runningTask.projectId._id;
			// task.runningTask.start = moment(task.runningTask.start);//.format('MMMM Do YYYY, h:mm:ss a');
			task.runningTask.end = Date();//moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
			task.runningTask.duration = task.calDuration(task.runningTask.start,task.runningTask.end);
			$http.put('/task/' + task.runningTask._id,{task: task.runningTask}).success(function(data){
				$interval.cancel(task.intervalObject);
				console.log(task.runningTask.projectId);
				shareService.projectTotalTime(task.runningTask.projectId);
				task.runningTask = null;
				task.Tasks=[];
				task.getTasks();
				
			});			
		};
	}]);

	app.controller('UserController',['$http',function($http){
		var hc = new HomeController();
		var av = new AccountValidator();
		var user = this;

		
		user.Name='';
		user.Id='';

		$http.get('/user').success(function(data){
			user.Name = data.name;
			user.Id = data._id;
			// console.log(data);
		});

		this.signOut = function(){
			var that = this;
			$.ajax({
				url: "/home",
				type: "POST",
				data: {logout : true},
				success: function(data){
		 			that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
				},
				error: function(jqXHR){
					console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
				}
			});
		};

		this.showLockedAlert = function(msg){
			$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
			$('.modal-alert .modal-header h3').text('Success!');
			$('.modal-alert .modal-body p').html(msg);
			$('.modal-alert').modal('show');
			$('.modal-alert button').click(function(){window.location.href = '/';})
			setTimeout(function(){window.location.href = '/';}, 3000);
		};
	}]);

	app.controller('ProjectController',['$http','$scope','shareService',function($http,$scope,shareService){

		var duration = moment.duration(0);

		var intervalObject = null

		var pro = this;
		pro.userId='';
		pro.Projects=[];
		pro.newProject={};
		pro.upProject={};
		pro.Tasks =[];


		$scope.$on('projectTotalTime',function(){
			pro.Projects.forEach(function(item){
				if(item._id == shareService.projectId){
					pro.upProject = item;
				}
			});
			pro.updateProjectTotalTime();
		});

		$http.get('/user').success(function(data){
			pro.userId = data._id;
		});

		$http.get('/projects').success(function(data){
			pro.Projects = data;
			// console.log(data);
		});

		this.getProjects = function(){
			$http.get('/projects').success(function(data){
				pro.Projects = data;
			});
			shareService.reInit();			
		};

		this.deleteProject = function(){
			$http.delete('/projects/' + pro.upProject._id).success(function(){
				shareService.deleteRelativeTasks(pro.upProject._id);
				pro.getProjects();
				pro.Tasks=[];
			});
		};

		this.addUpdateProject = function(id){
			var temp = $.grep(pro.Projects, function(e){
				if(e._id ==id){
					return e;
				}
			});
			pro.upProject= { _id: temp[0]._id 
							, name: temp[0].name
							,totalTime: temp[0].totalTime
							,userId: temp[0].userId
							,isRun: temp[0].isRun
							,time: temp[0].time };
			pro.getTasks(function(data){
				pro.Tasks = data;
			});
		};

		this.updateProject = function(){
			$http.put('/projects/'+pro.upProject._id, {project: pro.upProject}).success(
				function(){
					pro.getProjects();
					pro.upProject = {};
				});
		};

		this.getTasks = function(callback){
			$http.get('/task',{params:{projectId: pro.upProject._id}}).success(callback);
		};

		this.updateProjectTotalTime = function(){
			pro.getTasks(pro.calTotalTime);
		};

		this.test = function(){
			duration = moment.duration(0);
			if(intervalObject == null){
				intervalObject = setInterval(function(){
					duration.add({'s':1});
					console.log(duration);
				},1000);
			}else{
				clearInterval(intervalObject);
				intervalObject = null;
			}
		};

		this.calTotalTime = function(tasks){
			var totalTime = moment.duration();
			tasks.forEach(function(item){
				var d = moment.duration(item.duration);
				totalTime.add(d);
			});

			var h = moment.duration( totalTime.asMilliseconds()-(totalTime.asMilliseconds() % (3600*1000)));
			var m = moment.duration( totalTime.asMilliseconds() % (3600*1000) );
			var s = moment.duration( totalTime.asMilliseconds() );
			
			pro.upProject.totalTime = h.asHours() + ':' + 
									m.minutes() + ':' + s.seconds();

			// pro.upProject.totalTime = totalTime.hours() +':' +
			// 	totalTime.minutes() + ':' + totalTime.seconds();
			
			pro.updateProject();
		};



		this.addTask = function(){
			$http.post('/task',{ task : {
				projectId: pro.upProject._id
				,userId: pro.userId
				,name: 'task name'
				,start: moment(pro.upProject.time)
				,end: moment()
			}}).success(function(){});
		};

		this.stopProject = function(){
			if(pro.upProject.isRun){	//running => stop

				pro.addTask();

				pro.upProject.isRun = false;
				pro.upProject.time = null;
				pro.updateProjectTotalTime();
			}else{	//nothing

			}
		};

		this.startProject = function(){
			if(pro.upProject.isRun){	//nothing happen

			}else{
				pro.upProject.isRun = true;
				pro.upProject.time = moment();
				// console.log(pro.upProject);
				pro.updateProject();
			}
		};

		this.addProject = function(){
			// console.log(id);
			// console.log(pro.userId);
			$http.post('/projects',{
				project: {
				name: pro.newProject.name
				,totalTime: '0:0:0'
				,userId: pro.userId
				,isRun: false
				,time: null}
			}).success(
				function(){
					pro.getProjects();
					pro.newProject={};
				});
		};
	}]);
})();