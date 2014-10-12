'use strict';

var w = 1280,
  h = 800,
  rx = w / 2,
  ry = h / 2,
  m0,
  rotate = 0;

function mouse(e) {
  return [e.pageX - rx, e.pageY - ry];
}

function mousedown() {
  m0 = mouse(d3.event);
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
    div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
  }
}

function mouseup() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

    rotate += dm;
    if (rotate > 360) rotate -= 360;
    else if (rotate < 0) rotate += 360;
    m0 = null;

    div.style("-webkit-transform", null);

    $scope.battlefield
        .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
      .selectAll("g.node text")
        .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
        .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
  }
}


function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function newAttaque() {
  var attaques = git.generateAttaques(gitCommiters);

  if (attaques.length > 0) {
    var splines = bundle(attaques);
    var path = svg.selectAll("path.link")
      .data(attaques)
      .enter().append("svg:path")
      .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
      .attr("d", function(d, i) { return line(splines[i]); });
  }
}

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

              // commit.date.
              if (parseInt(commit.date.substring(11, 13)) <= 12) {
                attackModifiers.push({
                  rule: 'commit.date.substring(11, 13) <= 12',
                  value: -10
                });
              }
              if (parseInt(commit.date.substring(11, 13)) >= 12) {
                attackModifiers.push({
                  rule: 'commit.date.substring(11, 13) >= 12',
                  value: -10
                });
              }

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
                if (commit.message.toLowerCase().indexOf(element) > -1) {
                  attackModifiers.push({
                    rule: 'commit.message.contains("' + element + '")',
                    value: 10
                  });
                }
              });

              return attackModifiers;
            },
            processAction: function (commit) {
              var action = {
                source: '',
                targets: []
              };

              action.source = commit.committerId;

              commit.files.forEach(function (file) {
                if (file.hasOwnProperty('previousCommitter')) {
                  action.targets.push(file.previousCommitter.id);
                }
              });

              return action;
            }
          };
        })
        .factory('displayService', function () {
          return {
            createBattlefield: function () {
              var bundle = d3.layout.bundle();

              var div = d3.select("div.ng-scope").insert("div", "form")
                .style("top", "-80px")
                .style("left", "-160px")
                .style("width", w + "px")
                .style("height", w + "px")
                //s.style("position", "absolute")
                .style("-webkit-backface-visibility", "hidden");
              var svg = div.append("svg:svg")
                .attr("width", w)
                .attr("height", w)
                .append("svg:g")
                .attr("transform", "translate(" + rx + "," + ry + ")");
              return svg;
            },
            createNodesFromUsers: function (users) {
              var nodes = {};
              function find(name, data) { 
                var node = nodes[name];
                if (!node) {
                  node = nodes[name] = data || {name: name, children: []};
                  if (name.length) {
                    node.parent = find("");
                    node.parent.children.push(node);
                    node.key = name;
                    node.name = name;
                  }
                }
                return node;
              }
              
//              console.log(users);
              for (var key in users) {
                var user = users[key];
                find(user.login, user);
              };
              return nodes[""];
            },
            displayNodes: function(svg, nodes) {

                var cluster = d3.layout.cluster()
                  .size([360, ry - 120])
                  .sort(function(a, b) { return d3.ascending(a.key, b.key); });
                var tmp = cluster.nodes(nodes); //,
                svg.selectAll("g.node")
                    .data(tmp.filter(function(n) { return !n.children; }))
                  .enter().append("svg:g")
                    .attr("class", "node")
                    .attr("id", function(d) { return "node-" + d.key; })
                    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
                  .append("svg:text")
                    .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
                    .attr("dy", ".31em")
                    .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                    .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
                    .text(function(d) { return d.key; })
                    .on("mouseover", function mouseover(d) {
                      svg.selectAll("path.link.target-" + d.key)
                          .classed("target", true)
                          .each(updateNodes("source", true));

                      svg.selectAll("path.link.source-" + d.key)
                          .classed("source", true)
                          .each(updateNodes("target", true));
                    })
                    .on("mouseout", function mouseout(d) {
                      svg.selectAll("path.link.source-" + d.key)
                          .classed("source", false)
                          .each(this.updateNodes("target", false));

                      svg.selectAll("path.link.target-" + d.key)
                          .classed("target", false)
                          .each(this.updateNodes("source", false));
                    });
            },
            updateNodes: function(name, value) {
              return function(d) {
                if (value) this.parentNode.appendChild(this);
                $scope.battlefield.select("#node-" + d[name].key).classed(name, value);
              };
            }

          };
        })
        .controller('MainCtrl', ['$scope', '$interval', 'displayService', 'retreiveService', 'processService', function ($scope, $interval, displayService, retreiveService, processService) {
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
            $scope.battlefield = displayService.createBattlefield();

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

                          // Modifier: Initialization.
                          $scope.attackModifiers = processService.processAttackModifiers(commit);

                          // Modifier: Aggregation.
                          $scope.attackModifier = 0;
                          $scope.attackModifiers.forEach(function (element) {
                            $scope.attackModifier += element.value;
                          });

                          // Modifier: Apply.
                          $scope.users[commit.committerId].attack += $scope.attackModifier;

                          // Action: Initialization.
                          $scope.action = processService.processAction(commit);

                          // Action: Apply.
//                          console.log($scope.action);
                          $scope.action.targets.forEach(function (target) {
                            $scope.damage = Math.max(0, $scope.users[commit.committerId].attack - $scope.users[target].defense);
//                            console.log($scope.damage);
                            
                            $scope.users[target].life -= $scope.damage;
                          });
                          
                          var nodes = displayService.createNodesFromUsers($scope.users);
                          displayService.displayNodes($scope.battlefield, nodes);
                        });
                      });
                    });
                  });
                });
              }, $scope.interval, $scope.maxSteps);
            };
          }]);
