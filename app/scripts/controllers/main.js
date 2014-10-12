'use strict';

var w = 600,
  h = 600,
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
            retreivePreviousCommitters: function (repositoryId, filename, clientId, clientSecret) {
              var promise = $http.get('https://api.github.com/repos/' + repositoryId + '/commits' + '?path=' + filename + '&page=1&per_page=10&client_id=' + clientId + '&client_secret=' + clientSecret)
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
              if (parseInt(commit.date.substring(11, 13)) <= 7) {
                attackModifiers.push({
                  rule: 'commit.date.substring(11, 13) <= 7',
                  value: -10
                });
              }
              if (parseInt(commit.date.substring(11, 13)) >= 19) {
                attackModifiers.push({
                  rule: 'commit.date.substring(11, 13) >= 19',
                  value: -10
                });
              }

              // commit.files.length.
              if (commit.files.length < 10) {
                attackModifiers.push({
                  rule: 'commit.files.length > 10',
                  value: -10
                });
              }
              
              // commit.message.length.
              if (commit.message.length < 10) {
                attackModifiers.push({
                  rule: 'commit.message.length < 10',
                  value: -10
                });
              }
              if (commit.message.length > 50) {
                attackModifiers.push({
                  rule: 'commit.message.length < 50',
                  value: -10
                });
              }

              // commit.message.contains.
              [
                'add',
                'improve'
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
            processDefenseModifiers: function (commit) {
              var defenseModifiers = [];
              
              [
                'merge',
                'fix',
                'resolve'
              ].forEach(function (element) {
                if (commit.message.toLowerCase().indexOf(element) > -1) {
                  defenseModifiers.push({
                    rule: 'commit.message.contains("' + element + '")',
                    value: 10
                  });
                }
              });
              
              return defenseModifiers;
            },
            processAction: function (commit) {
              var action = {
                source: '',
                targets: []
              };

              action.source = commit.committerLogin;

              commit.files.forEach(function (file) {
                if (file.hasOwnProperty('previousCommitters')) {
                  file.previousCommitters.forEach(function (element) {
                    action.targets.push({
                      login: element.login,
                      id: element.id
                    });
                  });
                }
              });

              return action;
            },
            generateAttaques: function (nodes) {
              var attaques = [];
              var attaqueCount = this.getRandomInt(0, 1);
              while (attaqueCount > 0) {
                var source = nodes[this.getRandomInt(1, nodes.length)];
                var isMultipleAttaque = this.getRandomInt(0, 5);
                if (isMultipleAttaque === 0) {
                  nodes.forEach(function(target) {
                    if (source !== target) {
                      var attaque = {source: source, target: target};
                      attaques.push(attaque);
                    }
                  });
                } else {
                  var target = nodes[this.getRandomInt(1, nodes.length)];
                  if (source !== target) {
                    attaques.push({source: source, target: target});
                  }
                }
                attaqueCount--;
              }
              return attaques;
            },
            getRandomInt: function(min, max) {
              return Math.floor(Math.random() * (max - min + 1) + min);
            }
          };
        })
        .factory('displayService', function () {
          return {
            createBattlefield: function (bundle) {
              var div = d3.select("#d3").insert("div", "form")
                .style("top", "0px")
                .style("left", "0px")
                .style("width", w + "px")
                .style("height", w + "px")
                .style("position", "absolute")
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
              for (var key in users) {
                var user = users[key];
                find(user.login, user);
              };
              return nodes[""];
            },
            displayNodes: function(svg, cluster, nodes) {
                var tmp = cluster.nodes(nodes);
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
                    .attr("font-size", function(d) { return "" + ((d.life / 5) + 10) + "px"; })
                    .text(function(d) { return d.key; })
                    .on("mouseover", function mouseover(d) {
                      d3.event.preventDefault();
                      // svg.selectAll("path.link.target-" + d.key)
                      //     .classed("target", true)
                      //     .each(this.updateNodes(svg, "source", true));

                      // svg.selectAll("path.link.source-" + d.key)
                      //     .classed("source", true)
                      //     .each(this.updateNodes(svg, "target", true));
                    })
                    .on("mouseout", function mouseout(d) {
                      d3.event.preventDefault();
                      // svg.selectAll("path.link.source-" + d.key)
                      //     .classed("source", false)
                      //     .each(this.updateNodes(svg, "target", false));

                      // svg.selectAll("path.link.target-" + d.key)
                      //     .classed("target", false)
                      //     .each(this.updateNodes(svg, "source", false));
                    });
            },
            updateNodes: function(svg, name, value) {
              return function(d) {
                if (value) this.parentNode.appendChild(this);
                svg.select("#node-" + d[name].key).classed(name, value);
              };
            },
            findNodeByLogin: function (login, nodes) {
              var node;
              nodes.forEach(function (element) {
                if (element.login === login) {
                  node = element;
                }
              });
              return node;
            },
            estomperAttaques: function(svg, bundle) {

            },
            displayAttaques: function(svg, bundle, line, attaques) {
              var actions = {};
              for (var index = 0; index < attaques.length; ++index) {
                var actionsStep = attaques[index];
                if (actionsStep && actionsStep.length !== 0) {
                  actionsStep.forEach(function (action) {
                    var id = "path-" + action.source.key + "-" + action.target.key;
                    var attaque = {
                      id: id,
                      source: action.source,
                      target: action.target
                    };
                    if (!actions[id]) {
                      actions[id] = attaque;
                    }
                  });
                }
              }
              if (Object.keys(actions).length > 0) {
                var values = [];
                for (var k in actions) {
                  var value = actions[k];
                  values.push(value);
                }
                var splines = bundle(values);
                var links = svg.selectAll("path.link")
                        .data(values);
                // 1. exit
                var exitTransition = d3.transition().duration(750).each(function() {
                  links.exit().transition()
                      .style("opacity", 0)
                      .remove();
                });
                // 2. update
                var updateTransition = exitTransition.transition().each(function() {
                  links.transition()
                      .style("background", "orange");
                });
                // 3. enter
                var enterTransition = updateTransition.transition().each(function() {
                  links.enter().append("svg:path")
                    .attr("id", function(d) { return d.id; })
                    .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
                    .attr("d", function(d, i) { return line(splines[i]); });
                });
              }

            }
          };
        })
        .controller('MainCtrl', ['$scope', '$interval', 'displayService', 'retreiveService', 'processService', function ($scope, $interval, displayService, retreiveService, processService) {
            $scope.clientId = '3bb9d435e94403d10de1';
            $scope.clientSecret = 'eeeb700e0f2e679851fece64b0b84fba8fa35afd';
            $scope.repositoryId = 'angular/angular.js';
            $scope.since = '2014-01-01' + 'T00:00:00Z';
            $scope.until = '2014-10-11' + 'T24:00:00Z';
            $scope.interval = 4000;
            $scope.page = 1;
            $scope.perPage = 1;
            $scope.maxSteps = 10;
            $scope.baseLife = 100;
            $scope.baseAttack = 100;
            $scope.baseDefense = 100;
            
            $scope.panels = [];

            // Global initialization.
            $scope.users = {};
            $scope.nodes = [];
            $scope.bundle = d3.layout.bundle();
            $scope.battlefield = displayService.createBattlefield($scope.bundle);
            $scope.cluster = d3.layout.cluster()
                  .size([360, ry - 120])
                  .sort(function(a, b) { return d3.ascending(a.key, b.key); });
            $scope.line = d3.svg.line.radial()
              .interpolate("bundle")
              .tension(.85)
              .radius(function(d) { return d.y; })
              .angle(function(d) { return d.x / 180 * Math.PI; });
            $scope.attaques = [];

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
                $scope.commits = [];

                // This does not make sense, commit*s* should have been commit to simplify things.
                retreiveService.retreiveCommits($scope.repositoryId, $scope.since, $scope.until, $scope.page + $scope.step++, $scope.perPage, $scope.clientId, $scope.clientSecret).then(function (response) {
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
                        retreiveService.retreivePreviousCommitters($scope.repositoryId, file.filename, $scope.clientId, $scope.clientSecret).then(function (response) {
                          fileArray[fileIndex].previousCommitters = [];
                          
                          response.data.forEach(function (element) {
                            fileArray[fileIndex].previousCommitters.push({
                              login: element.committer.login,
                              id: element.committer.id
                            });
                          });
                          
                          // All the data is ready to be processed.

                          // Modifier: Initialization.
                          $scope.attackModifiers = processService.processAttackModifiers(commit);
                          $scope.defenseModifiers = processService.processDefenseModifiers(commit);

                          // Modifier: Aggregation.
                          $scope.attackModifier = 0;
                          $scope.attackModifiers.forEach(function (element) {
                            $scope.attackModifier += element.value;
                          });
                          $scope.defenseModifier = 0;
                          $scope.defenseModifiers.forEach(function (element) {
                            $scope.defenseModifier += element.value;
                          });
                          
                          // Modifier: Apply.
                          $scope.users[commit.committerId].attack += $scope.attackModifier;
                          $scope.users[commit.committerId].defense += $scope.defenseModifier;

                          $scope.nodeRoot = displayService.createNodesFromUsers($scope.users);

                          // Action: Initialization.
                          $scope.actions = [];
                          $scope.action = processService.processAction(commit);
                          $scope.action.targets.forEach(function (target) {
                            $scope.actions.push({
                              source: displayService.findNodeByLogin($scope.action.source, $scope.nodeRoot.children),
                              target: displayService.findNodeByLogin(target.login, $scope.nodeRoot.children),
                            });
                          });
                          $scope.attaques = [];
                          $scope.attaques.push($scope.actions);
                          // console.log($scope.attaques);
//                          $scope.attaques = [];
//                          $scope.attaques.push(processService.generateAttaques($scope.nodeRoot.children));
//                          console.log($scope.attaques);
                          
                          // Action: Apply.
                          $scope.damages = [];
                          $scope.action.targets.forEach(function (target) {
                            if (target.id !== commit.committerId) {
                              var damage = Math.max(0, $scope.users[commit.committerId].attack - $scope.users[target.id].defense / 10);
                              $scope.users[target.id].life -= damage;
                              
                              $scope.damages.push({
                                targetId: target.id,
                                targetLogin: target.login,
                                damage: damage
                              });
                            }
                          });
                          
                          // Damage: Aggregation.
                          $scope.damage = 0;
                          $scope.damages.forEach(function (element) {
                            $scope.damage += element.damage;
                          });
                          displayService.displayNodes($scope.battlefield, $scope.cluster, $scope.nodeRoot);
                          displayService.estomperAttaques($scope.battlefield, $scope.bundle);
                          displayService.displayAttaques($scope.battlefield, $scope.bundle, $scope.line, $scope.attaques);
                                                    
                          // Panel.
                          $scope.panels.unshift({
                            commitSha: commit.sha,
                            commitMessage: commit.message,
                            committerLogin: commit.committerLogin,
                            attackModifier: $scope.attackModifier,
                            attackModifiers: $scope.attackModifiers,
                            defenseModifier: $scope.defenseModifier,
                            defenseModifiers: $scope.defenseModifiers,
                            damage: $scope.damage,
                            damages: $scope.damages,
                            life: $scope.users[commit.committerId].life,
                            attack: $scope.users[commit.committerId].attack,
                            defense: $scope.users[commit.committerId].defense
                          });
                        });
                      });
                    });
                  });
                });
              }, $scope.interval, $scope.maxSteps);
            };
          }]);
