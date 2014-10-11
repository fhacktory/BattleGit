'use strict';
angular.module('battleGitApp')
        .factory('retreiveService', function ($http) {
          return {
            retreiveCommit: function (repositoryId, commitSha, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits/' + commitSha + '?client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data, status) {
                        var commit;
                        commit = {
                          sha: data.sha,
                          files: data.files
                        };
                        return commit;
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            },
            retreiveCommits: function (repositoryId, since, until, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits' + '?since=' + since + '&until=' + until + '&client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data) {
                        var commits = [];
                        data.forEach(function (element) {
                          var commit = {
                            sha: element.sha,
                            date: element.committer.date,
                            message: element.commit.message,
                            committerLogin: element.committer.login,
                            committerId: element.committer.id
                          };

                          commits.push(commit);
                        });
                        return commits;
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            },
            retreiveContributors: function (repositoryId, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/contributors' + '?client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data) {
                        var contributors = [];
                        data.forEach(function (element) {
                          var contributor = {
                            login: element.login,
                            id: element.id
                          };
                          contributors.push(contributor);
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
            $scope.clientId = '3bb9d435e94403d10de1';
            $scope.clientSecret = 'eeeb700e0f2e679851fece64b0b84fba8fa35afd';
            $scope.repositoryId = 'angular/angular.js';
            $scope.since = '2014-10-11T00:00:00Z';
            $scope.until = '2014-10-11T24:00:00Z';

            $scope.retreive = function () {
              retreiveService.retreiveCommits($scope.repositoryId, $scope.since, $scope.until, $scope.clientId, $scope.clientSecret).then(function (response) {
                $scope.commits = response.data;
                $scope.commits.forEach(function (commit, index, array) {
                  retreiveService.retreiveCommit($scope.repositoryId, commit.sha, $scope.clientId, $scope.clientSecret).then(function (response) {
                    // Reference modification.
                    array[index].files = response.data.files;
                  });
                });
              });

//              retreiveService.retreiveContributors($scope.repositoryId, $scope.clientId, $scope.clientSecret).then(function (response) {
//                $scope.contributors = response.data;
//              });
            };
          }]);
