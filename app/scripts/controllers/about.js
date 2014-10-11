'use strict';

/**
 * @ngdoc function
 * @name battleGitApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the battleGitApp
 */
angular.module('battleGitApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
