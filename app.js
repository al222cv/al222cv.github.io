var app = angular.module('pingpong', ['ngMaterial']);
var remoteDb = new PouchDB('https://larchii.cloudant.com/dailypingpong', {
	auth: {
	 	username: 'larchii',
		password: 'lolsson1'
	}
});

app.factory('$eventStore', function(){
	return {
		save: function(eventName, data){
			data.type = eventName;
			data.metadata = {
				date: new Date()
			};

			return remoteDb.put(data);
		}
	};
});

app.controller('MatchCtrl', function($scope, $mdToast, $eventStore){
	var initalScore = 6;
	$scope.stats = { home: null, away: null };
	setScore();
	setLatestMatch();

	//listen to matchedPlayedEvents and update result!
	remoteDb.changes({
	  since: 'now',
	  live: true,
	  include_docs: true
	}).on('change', function(change) {
		if(change.doc.type != 'matchPlayedEvent') return;

		setScore();
		setLatestMatch();
	});

	$scope.newMatch = function(player){
		var eventData = {
			_id: new Date(),
			winner: player
		};

		$eventStore.save('matchPlayedEvent', eventData)
		.then(function (response) {
			var toast = $mdToast.simple()
			            .content('Match sparad, ' +  player  + ' vinnare!')
			            //.action('Ångra')
			            .hideDelay(5000)
			            .highlightAction(true)
			            .position('bottom right');
		    
			$mdToast.show(toast).then(function(response) {
				if(response == 'ok'){

		    	}
			});	
		}).catch(function (err) {
			console.log(err);
		});
	};

	function setScore(){
		remoteDb.query('sumByWinner',{key: 'Andreas',reduce: true}).then(function(data){
			$scope.$apply(function(){
				$scope.stats.home = data.rows[0].value + initalScore;
			});
		});

		remoteDb.query('sumByWinner',{key: 'Mikael',reduce: true}).then(function(data){
			$scope.$apply(function(){
				$scope.stats.away = data.rows[0].value;
			});
		});
	}

	function setLatestMatch(){
		remoteDb.query('latestMatch', { limit: 1, descending: true })
		.then(function(data){
			$scope.$apply(function(){
				$scope.stats.latestMatch = data.rows[0].key;			
			});
		});
	}
});