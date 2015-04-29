import Ember from 'ember';
import Base from 'simple-auth/authenticators/base';
import config from '../config/environment';

/**
 * This custom authenticator expects { access_token: 'xxx', token_type: 'bearer' } to be passed as options.token
 */

export
default Base.extend({
  restore: function(data) {
    // @todo: The authenticator should check if the access_token is still valid
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (data.access_token) {
        resolve(data);
      } else {
        reject();
      }
    });
  },
  authenticate: function(options) {
    var sessionData = options.token;
    sessionData.contentful_space = config.Contentful.space;

    return new Ember.RSVP.Promise(function(resolve) {
      resolve(sessionData);
    });
  },
  invalidate: function() {
    return new Ember.RSVP.Promise(function(resolve) {
      resolve(null);
    });
  }
});
