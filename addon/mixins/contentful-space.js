import Ember from 'ember';

var memcache = {};

var ContentfulMixin = Ember.Mixin.create({

  connectSpace: function() {
    var spaceId = this.get('session.secure.contentful_space');

    if (!spaceId) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        reject("No session or missing contentful_space ID in session data.");
      });
    }

    if (memcache[spaceId]) {
      return memcache[spaceId];
    }

    var accessToken = this.get('session.secure.access_token');
    var client = this.contentfulManagement.createClient({
      accessToken: accessToken,
      secure: true
    });

    var promise = client.getSpace(spaceId);
    memcache[spaceId] = promise;
    return promise;
  }
});

export
default ContentfulMixin;
