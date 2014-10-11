'use strict';

angular.module('battleGitApp')
        .factory('retreiveService', function ($window) {
          return function (repositoryURL) {
            $window.alert(repositoryURL);
          };
        })
        .controller('MainCtrl', function ($scope, retreiveService) {
          $scope.repositoryURL = 'https://github.com/fhacktory/BattleGit';

          $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
          ];

          $scope.retreive = function () {
            retreiveService($scope.repositoryURL);
          };
        });
