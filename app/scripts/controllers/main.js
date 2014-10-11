'use strict';

angular.module('battleGitApp')
        .factory('retreiveService', function ($http) {
          return {
            retreiveCommit: function (repositoryId, commitSha, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits/' + commitSha + '?client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data, status) {
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            },
            retreiveCommits: function (repositoryId, since, until, page, perPage, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits' + '?since=' + since + '&until=' + until + '&page=' + page + '&per_page=' + perPage + '&client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data) {
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            },
            retreiveContributors: function (repositoryId, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/contributors' + '?client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data) {
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            },
            retreivePreviousCommitter: function (repositoryId, filename, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits' + '?path=' + filename + '&page=1&per_page=1&client_id=' + clientId + '&client_secret=' + clientSecret)
                      .success(function (data) {
                      })
                      .error(function () {
                        alert('ERROR');
                      });
              return promise;
            }
          };
        })
        .factory('processService', function () {
          return {
            processAttackModifiers: function (commit) {
              var attackModifiers = [];

              // commit.message.length.
              if (commit.message.length < 100) {
                attackModifiers.push({
                  rule: 'commit.message.length < 100',
                  value: -10
                });
              }

              // commit.message.contains.
              [
                'added'
              ].forEach(function (element) {
                if (commit.message.toLowerCase().contains(element)) {
                  attackModifiers.push({
                    rule: 'commit.message.contains("' + element + '")',
                    value: 10
                  });
                }
              });

              return attackModifiers;
            }

          };
        })
        .controller('MainCtrl', ['$scope', '$interval', 'retreiveService', 'processService', function ($scope, $interval, retreiveService, processService) {
            $scope.clientId = '3bb9d435e94403d10de1';
            $scope.clientSecret = 'eeeb700e0f2e679851fece64b0b84fba8fa35afd';
            $scope.repositoryId = 'angular/angular.js';
            $scope.since = '2014-01-01' + 'T00:00:00Z';
            $scope.until = '2014-10-11' + 'T24:00:00Z';
            $scope.interval = 2000;
            $scope.page = 0;
            $scope.perPage = 1;
            $scope.maxSteps = 1;
            $scope.baseLife = 100;
            $scope.baseAttack = 100;
            $scope.baseDefense = 100;

            // Global initialization.
            $scope.users = {};

            // Users initialization.
            retreiveService.retreiveContributors($scope.repositoryId, $scope.clientId, $scope.clientSecret).then(function (response) {
              response.data.forEach(function (element) {
                $scope.users[element.id] = {
                  login: element.login,
                  id: element.id,
                  life: $scope.baseLife,
                  attack: $scope.baseAttack,
                  defense: $scope.baseDefense
                };
              });
            });

            // Main loop.
            $scope.step = 0;
            $scope.run = function () {
              $interval(function () {
                $scope.step++;
                $scope.commits = [];

                // This does not make sense, commit*s* should have been commit to simplify things.
                retreiveService.retreiveCommits($scope.repositoryId, $scope.since, $scope.until, $scope.page + $scope.step, $scope.perPage, $scope.clientId, $scope.clientSecret).then(function (response) {
                  response.data.forEach(function (element) {
                    var commit = {
                      sha: element.sha,
                      date: element.commit.committer.date,
                      message: element.commit.message,
                      committerLogin: element.committer.login,
                      committerId: element.committer.id
                    };
                    $scope.commits.push(commit);

                    // Add the current user if it has not been detected until now.
                    if (!$scope.users.hasOwnProperty(commit.committerId)) {
                      $scope.users[commit.committerId] = {
                        login: commit.committerLogin,
                        id: commit.committerId,
                        life: $scope.baseLife,
                        attack: $scope.baseAttack,
                        defense: $scope.baseDefense
                      };

                      console.log(commit.committerId);
                    }
                  });

                  // Each retreived commit is processed one at a time.
                  $scope.commits.forEach(function (commit, commitIndex, commitArray) {
                    retreiveService.retreiveCommit($scope.repositoryId, commit.sha, $scope.clientId, $scope.clientSecret).then(function (response) {
                      // Reference modification.
                      commitArray[commitIndex].files = response.data.files;

                      response.data.files.forEach(function (file, fileIndex, fileArray) {
                        retreiveService.retreivePreviousCommitter($scope.repositoryId, file.filename, $scope.clientId, $scope.clientSecret).then(function (response) {
                          fileArray[fileIndex].previousCommitter = {
                            login: response.data[0].committer.login,
                            id: response.data[0].committer.id
                          };

                          // All the data is ready to be processed.
                          $scope.attackModifiers = processService.processAttackModifiers(commit);

                          // Modifier aggregation.
                          $scope.attackModifier = 0;
                          $scope.attackModifiers.forEach(function (element) {
                            $scope.attackModifier += element.value;
                          });

                          // Apply the modifiers.
                          $scope.users[commit.committerId].attack += $scope.attackModifier;
                        });
                      });
                    });
                  });
                });
              }, $scope.interval, $scope.maxSteps);
            };
          }]);
