import Ember from 'ember';

export
default Ember.Route.extend({
  beforeModel: function() {
    var token = {};
    window.location.hash.split('&').forEach(function (parameter) {
      var keyval = parameter.split('=');
      token[keyval[0].replace('#', '')] = keyval[1];
    });

    this
      .get('session')
      .authenticate('authenticator:contentful', {
        token: token
      });
  }
});
