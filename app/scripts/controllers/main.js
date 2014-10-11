'use strict';

angular.module('battleGitApp')
        .factory('retreiveService', function ($http) {
          var clientQuery = '?client_id=3bb9d435e94403d10de1&client_secret=eeeb700e0f2e679851fece64b0b84fba8fa35afd';

          return {
            retreiveCommit: function (repositoryId, commitSha) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits/' + commitSha + clientQuery)
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
            retreiveCommits: function (repositoryId) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits' + clientQuery)
                      .success(function (data) {
                        var commits = [];
                        data.forEach(function (element) {
                          var commit = {
                            sha: element.sha,
                            date: element.committer.date,
                            message: element.message,
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
            retreiveContributors: function (repositoryId) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/contributors' + clientQuery)
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
            $scope.repositoryId = 'angular/angular.js';

            $scope.retreive = function () {
              retreiveService.retreiveCommits($scope.repositoryId).then(function (response) {
                $scope.commits = response.data;

                $scope.commits.forEach(function (commit, index, array) {
                  retreiveService.retreiveCommit($scope.repositoryId, commit.sha).then(function (response) {
                    // Reference modification.
                    array[index].files = response.data.files;
                  });
                });
              });

              retreiveService.retreiveContributors($scope.repositoryId).then(function (response) {
                $scope.contributors = response.data;
              });
            };
          }]);
