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
	//get score
	remoteDb.get('scoreReadData')
	.then(function(doc){
		$scope.stats = doc;
		$scope.$apply();
	});

	//listen to matchedPlayedEvents and update result!
	remoteDb.changes({
	  since: 'now',
	  live: true,
	  include_docs: true
	}).on('change', function(change) {
		if(change.doc.type != 'matchPlayedEvent') return;
		
		remoteDb.get('scoreReadData')
		.then(function(doc){
			doc.scores[0].score += change.doc.winner == 'Andreas' ? 1 : 0;
			doc.scores[1].score += change.doc.winner == 'Mikael' ? 1 : 0;
			doc.latestMatch = change.doc.metadata.date;
			
			remoteDb.put(doc);

			$scope.stats = doc;
			$scope.$apply();

			console.log('in Success readdata');
		}).catch(function (err) {
			console.log('in error readdata');
		 	var scoreReadData = {
		 		_id: 'scoreReadData',
		 		scores: [{
		 			player: 'Andreas',
		 			score: change.doc.winner == 'Andreas' ? 1 : 0
		 		},{
		 			player: 'Mikael',
		 			score: change.doc.winner == 'Mikael' ? 1 : 0
		 		}],
		 		latestMatch: change.doc.metadata.date
		 	};

		 	remoteDb.put(scoreReadData);
		 	$scope.stats = scoreReadData;
		 	$scope.$apply();
		});
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

});