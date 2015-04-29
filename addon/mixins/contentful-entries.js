/* global _ */

import Ember from 'ember';

var ContentfulMixin = Ember.Mixin.create({

  // request data from the `editor_interfaces` endpoint for a specific content type (id)
  getEditorUI: function(contentTypeId) {
    var accessToken = this.get('session.access_token');
    var spaceId = this.get('session.contentful_space');
    return Ember.$
      .getJSON(this.get('contentfulHost') + 'spaces/' + spaceId + '/content_types/' + contentTypeId + '/editor_interfaces/default?access_token=' + accessToken);
  },

  // this function reduces resolved Entries into Link objects that the Content Management API can handle
  reduceEntriesToLinks: function(entry, locale) {
    if (!locale) {
      throw new Error("Function reduceEntriesToLinks needs to be called with `locale`!");
    }
    var copy = _.cloneDeep(entry);
    _.each(copy.fields, function(fieldObj, key) {
      if (!fieldObj || !fieldObj[locale]) { // skip undefined fields
        return true;
      }
      var field = fieldObj[locale]; // take the localized content
      if (!field && !_.isBoolean(field)) { // skip undefined localized content
        return true; // skip null, undefined, etc...
      }
      if (field.sys) { // if it's an Entry or Asset, link it
        var link = {
          sys: {
            type: 'Link',
            linkType: field.sys.type,
            id: field.sys.id
          }
        };
        copy.fields[key][locale] = link;
        return true;
      }
      if (Ember.isArray(field) && field.length > 0 && field[0].sys) { // if it's an Array of Entries or Assets, link each item in the Array
        var array = [];
        _.each(field, function(fieldVal) {
          array.push({
            "sys": {
              "type": "Link",
              "linkType": fieldVal.sys.type,
              "id": fieldVal.sys.id
            }
          });
        });
        copy.fields[key][locale] = array;
      }
    });
    return copy;
  },

  // this function mutates a set of Entries and exchanges asset links for Asset objects (if provided in the assets parameter)
  resolveAssets: function(entries, assets) {
    _.each(entries, function(entry) {
      _.each(entry.fields, function(field, key) {
        if (field && field['en-US'] && field['en-US'].sys && field['en-US'].sys.linkType === 'Asset') {
          var asset = _.find(assets, function(a) {
            return a.sys.id === field['en-US'].sys.id;
          });
          if (asset) {
            Ember.set(entry, 'fields.' + key + '.en-US', asset);
          } else {
            //console.warn("Asset with ID " + field['en-US'].sys.id + ' could not be resolved!');
          }
        }
      });
    });
    return entries;
  },

  // save a Contentful entry
  saveEntry: function(entry) {
    var self = this;
    return this.connectSpace()
      .then(function(space) {
        return space.updateEntry(self.reduceEntriesToLinks(entry, 'en-US'))
          .then(function(nextVersion) {
            Ember.set(entry, 'sys', nextVersion.sys);
            return entry;
          });
      });
  },

  // list linked Entries and Assets for a given Entry (only the Entries of the given content types are included in the list)
  listEntryChildren: function(entry, includedTypes, locale) {
    var entries = {},
      assets = {};
    includedTypes = includedTypes || {};

    var listChildEntries = function(collection, locale) {
      _.each(collection, function(val) {
        if (val && val.sys) {
          if (val.sys.type === 'Asset') {
            assets[val.sys.id] = val;
          }
          if (val.sys.type === 'Entry') {
            if (val.sys.contentType && includedTypes[val.sys.contentType.sys.id]) {
              entries[val.sys.id] = val;
              listChildEntries(val.fields, locale);
            }
          }
        }
        if (!_.isEmpty(val) && val[locale] && val[locale].sys) {
          if (val[locale].sys.type === 'Asset') {
            assets[val[locale].sys.id] = val[locale];
          }
          if (val[locale].sys.type === 'Entry') {
            if (val[locale].sys.contentType && includedTypes[val[locale].sys.contentType.sys.id]) {
              entries[val[locale].sys.id] = val[locale];
              listChildEntries(val[locale].fields, locale);
            }
          }
        }
        if (_.isArray(val)) {
          listChildEntries(val, locale);
        }
        if (_.isArray(val[locale])) {
          listChildEntries(val[locale], locale);
        }
      });
    };

    entries[entry.sys.id] = entry; // push root entry on the stack
    listChildEntries(entry.fields, locale); // recursively add entries (possibly creates errors)
    return {
      entries: entries,
      assets: assets,
    };
  },

  /**
   * This function traverses a Contentful entry and linked elements and re-publishes them with latest changes
   * Only contenttypes with their ID defined as a key in `includedTypes` are included in the list.
   * If an entry is not included, it's children won't be traversed
   * All assets of inlcuded entries will be included as well.
   *
   * @todo : remove nasty controller dependency
   *
   * @param  {Entry}
   * @param  {Object}
   */
  publishEntryWithChildren: function(entry, includedTypes, controller) {
    var self = this;
    var locale = 'en-US';
    var list = this.listEntryChildren(entry, includedTypes, locale);
    var report = Ember.Object.create({
      status: 'inprogress',
      assetsValidated: false,
      assetsTotal: _.size(list.assets),
      assetsPublished: 0,
      entriesValidated: false,
      entriesTotal: _.size(list.entries),
      entriesPublished: 0
    });

    controller.set('publishingReport', report);

    return this.connectSpace()
      .then(function(space) {
        return self.validateAssets(list.assets, locale) // validate assets
        .then(function() {
          report.set('assetsValidated', true);
          return self.validateEntries(list.entries, locale); // validate entries
        })
          .then(function() {
            report.set('entriesValidated', true);
            var assets = _.values(list.assets);
            if (assets.length === 0) {
              return new Ember.RSVP.Promise(function(resolve) {
                resolve(true);
              });
            }
            return window.Promise
              .map(assets, function(asset) { // first round we publish all attached Assets
                return space.publishAsset(asset)
                  .then(function(result) {
                    Ember.set(asset, 'sys', result.sys);
                    report.incrementProperty('assetsPublished');
                    return result;
                  });

              }, {
                concurrency: 2 // rate-limit API calls
              });
          })
          .then(function() {
            var entries = _.values(list.entries);
            return window.Promise
              .map(entries, function(entry) { // second round we publish all Entries
                return space.publishEntry(entry)
                  .then(function(result) {
                    Ember.set(entry, 'sys', result.sys);
                    report.incrementProperty('entriesPublished');
                    return result;
                  });
              }, {
                concurrency: 2 // rate-limit API calls
              })
              .then(function(published) {
                report.set('status', 'done');
                return published;
              });
          });
      });
  }
});

export
default ContentfulMixin;
