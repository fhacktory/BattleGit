'use strict';

angular.module('battleGitApp')
        .factory('retreiveService', function ($window, $http) {
          return {
            retreiveCommits: function (repositoryID) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryID + '/commits')
                      .success(function (data) {
                        var commits = [];
                        data.forEach(function (element) {
                          commits.push({
                            sha: element.sha,
                            date: element.committer.date,
                            message: element.message,
                            committerLogin: element.committer.login,
                            committerId: element.committer.id
                          });
                        });
                        return commits;
                      })
                      .error(function () {
                        alert('ERROR');
                      });

              return promise;
            },
            retreiveContributors: function (repositoryID) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryID + '/contributors')
                      .success(function (data) {
                        var contributors = [];
                        data.forEach(function (element) {
                          contributors.push({
                            login: element.login,
                            id: element.id
                          });
                        });
                        return contributors;
                      })
                      .error(function () {
                        alert('ERROR');
                      });

              return promise;
            }
          };
        })
        .controller('MainCtrl', ['$scope', '$http', 'retreiveService', function ($scope, $http, retreiveService) {
            $scope.repositoryID = 'angular/angular.js';

            $scope.retreive = function () {
              $scope.commits = [];
              retreiveService.retreiveCommits($scope.repositoryID).then(function (response) {
                $scope.commits = response.data;
              });
              retreiveService.retreiveContributors($scope.repositoryID).then(function (response) {
                $scope.contributors = response.data;
              });
            };
          }]);
