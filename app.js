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
	//init
	var localStats = localStorage.getItem('stats');
	var localFiveLatestMatches = localStorage.getItem('fiveLatestMatches');
	var pageLimit = 5;
	var pageSkip = 0;

	$scope.stats =  localStats ? JSON.parse(localStats) : { home: null, away: null };
	$scope.fiveLatestMatches = localFiveLatestMatches ? JSON.parse(localFiveLatestMatches) : null;
	$scope.latestMatches = localFiveLatestMatches ? JSON.parse(localFiveLatestMatches).reverse() : [];
	$scope.totalMatches = localStorage.getItem('totalMatches');
	
	setScore();
	setLatestMatch(true);

	//listen to matchedPlayedEvents and update result!
	remoteDb.changes({
	  since: 'now',
	  live: true,
	  include_docs: true
	}).on('change', function(change) {
		//reload score
		setScore();
		setLatestMatch(true);

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

	$scope.loadMoreMatches = function(){
		setLatestMatch();
	}

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

	function setLatestMatch(reset){
		if(reset){
			pageLimit = $scope.latestMatches.length || pageLimit; // : $scope.latestMatches.length;
			pageSkip = 0;
		}

		remoteDb.query('latestMatch', { limit: pageLimit, skip: pageSkip, descending: true, include_docs: true })
		.then(function(data){
			pageSkip += pageLimit;

			if(reset){
				$scope.latestMatches = [];
			}

			$scope.$apply(function(){
				$scope.latestMatches.push.apply($scope.latestMatches, data.rows);
				$scope.totalMatches = data.total_rows;
				$scope.showLoadMoreButton = data.total_rows > $scope.latestMatches.length;

				localStorage.setItem('totalMatches', data.total_rows);
				if(reset){
					var fiveLatestMatches = data.rows.slice(0,5).reverse();
					$scope.fiveLatestMatches = fiveLatestMatches;
					localStorage.setItem('fiveLatestMatches', JSON.stringify(fiveLatestMatches));
				}
			});
		});
	}
});