'use strict';

/**
 * @ngdoc function
 * @name battleGitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the battleGitApp
 */
angular.module('battleGitApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
