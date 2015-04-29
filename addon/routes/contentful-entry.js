/* global _ */

import Ember from 'ember';

export
default Ember.Route.extend({
  serialize: function(model, params) {
    if (params.length !== 1) {
      return;
    }
    return {
      id: model.sys.id
    };
  },

  model: function(params) {
    var spaceId = this.get('session.contentful_space');
    var self = this;
    return Ember.$
      .getJSON(this.get('contentfulPreviewHost') + 'spaces/' + spaceId + '/entries?sys.id=' + params.id + '&include=3&access_token=' + this.get('contentfulPreviewKey'))
      .then(function(result) {
        if (result.total === 0) {
          throw new Error('Not found or not ready');
        }
        var entries = [];
        var assets = [];
        if (result.includes) {
          _.each(result.includes.Entry, function(entry) {
            entries.push(entry.sys.id);
          });
          _.each(result.includes.Asset, function(asset) {
            assets.push(asset.sys.id);
          });
        }
        return {
          entries: entries,
          assets: assets
        };
      })
      .then(function(links) {
        return self
          .connectSpace()
          .then(function(space) {
            var promises = {};
            promises.entries = space.getEntries({
              'sys.id[in]': [params.id].concat(links.entries)
            });
            if (links.assets.length > 0) {
              promises.assets = space.getAssets({
                'sys.id[in]': links.assets
              });
            }
            return new Ember.RSVP.hashSettled(promises);
          })
          .then(function(results) {
            var entries = results.entries.value;
            if (results.assets && results.assets.value) {
              var assets = results.assets.value;
              entries = self.resolveAssets(entries, assets);
            }
            var promises = _.map(entries, function(entry) {
              return self.ensureContentFieldsArePresent(entry); // cannot map directly, since the iteration function gets called with a different set of parameters
            }, self);
            return new Ember.RSVP.all(promises);
          })
          .then(function(entries) {
            return _.find(entries, function(entry) {
              return entry.sys.id === params.id;
            });
          });
      });
  },
});
