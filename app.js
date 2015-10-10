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
	var localStats = localStorage.getItem('stats');
	$scope.stats =  localStats ? JSON.parse(localStats) : { home: null, away: null };
	
	setScore();
	setLatestMatch();

	//listen to matchedPlayedEvents and update result!
	remoteDb.changes({
	  since: 'now',
	  live: true,
	  include_docs: true
	}).on('change', function(change) {
		//reload score
		setScore();
		setLatestMatch();

		//show message
		var message =  change.deleted ? 'Match borttagen!' : 'Match sparad, ' +  change.doc.winner  + ' vinnare!'
		var toast = $mdToast.simple()
		            .content(message)
		            .hideDelay(3000)
		            .highlightAction(true)
		            .position('bottom right');
	    
		$mdToast.show(toast);
	});

	$scope.newMatch = function(player){
		var eventData = {
			_id: new Date(),
			winner: player
		};

		$eventStore.save('matchPlayedEvent', eventData);
	};

	$scope.deleteMatch = function(doc){
		remoteDb.remove(doc);
	};

	function setScore(){
		remoteDb.query('sumByWinner',{key: 'Andreas',reduce: true}).then(function(data){
			$scope.$apply(function(){
				$scope.stats.home = data.rows[0].value;
				localStorage.setItem('stats', JSON.stringify($scope.stats));
			});
		});

		remoteDb.query('sumByWinner',{key: 'Mikael',reduce: true}).then(function(data){
			$scope.$apply(function(){
				$scope.stats.away = data.rows[0].value;
				localStorage.setItem('stats', JSON.stringify($scope.stats));
			});
		});
	}

	function setLatestMatch(){
		remoteDb.query('latestMatch', { limit: 20, descending: true, include_docs: true })
		.then(function(data){
			$scope.$apply(function(){
				$scope.latestMatches = data.rows;
				$scope.fiveLatestMatches = data.rows.slice(0,5).reverse();
			});
		});
	}
});