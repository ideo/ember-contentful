/* global _ */

import Ember from 'ember';

// this is intentionally a module variable / used for in-memory caching
var memcache = {
  contentTypes: null
};

var ContentfulMixin = Ember.Mixin.create({

  // load all content type definitions from Contentful
  loadContentTypes: function() {
    if (memcache.contentTypes === null) {
      var spaceId = this.get('session.secure.contentful_space');
      var accessToken = this.get('session.secure.access_token');
      var promise = Ember.$
        .ajax({
          dataType: "json",
          headers: {
            'X-Contentful-Skip-Transformation': true
          },
          url: this.get('contentfulHost') + 'spaces/' + spaceId + '/content_types?access_token=' + accessToken
        })
        .then(function(result) {
          var types = {};
          _.each(result.items, function(cType) {
            types[cType.sys.id] = cType;
          });
          return types;
        });
      memcache.contentTypes = promise;
      return promise;
    } else {
      return memcache.contentTypes;
    }
  },

  // get a specific content type defintion by id
  getContentType: function(contentTypeId) {
    return this.loadContentTypes()
      .then(function(types) {
        return types[contentTypeId];
      });
  },

  // this is a helper method that defines all Entry.fields that Contentful's API response may have omitted. Unfortunately this is necessary to enbale Ember's value bindings and observers to work properly.
  ensureContentFieldsArePresent: function(entry, locale) {
    locale = locale || 'en-US'; // default fallback
    entry.fields = entry.fields || {};
    return this.getContentType(entry.sys.contentType.sys.id)
      .then(function(contentType) {
        _.each(contentType.fields, function(field) {
          if (!field.disabled) {
            if (!entry.fields.hasOwnProperty(field.apiName) || entry.fields[field.apiName] === null) {
              Ember.set(entry, 'fields.' + field.apiName, Ember.Object.create({}));
            }
            if (!entry.fields[field.apiName].hasOwnProperty(locale) || entry.fields[field.apiName][locale] === null) {
              // yes, we might leave this value at NULL, but we need to make sure that it shouldn't be an array
              Ember.set(entry, 'fields.' + field.apiName + '.' + locale, field.type === 'Array' ? [] : null);
            }
          }
        });
        return entry;
      });
  },

  // maps content type id -> name/slug
  getContentTypeName: function(id) {
    return this.get('contentTypeMap')[id] || null;
  },

  // maps content type name/slug -> id
  getContentTypeId: function(slug) {
    return this.get('contentTypeMapNames')[slug] || null;
  },

  // this reads the predefined values accepted in a field from a given content type definition
  findSymbolOptions: function(contentType, fieldId) {
    var field = _.findWhere(contentType.fields, {
      apiName: fieldId
    });
    var options = [];
    if (field.validations) {
      _.each(field.validations, function(validation) {
        if (validation['in']) {
          options = validation['in'];
        }
      });
    }
    if (field.items) {
      _.each(field.items.validations, function(validation) {
        if (validation['in']) {
          options = validation['in'];
        }
      });
    }
    return options;
  }

});

export
default ContentfulMixin;
