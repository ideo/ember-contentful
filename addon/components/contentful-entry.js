import Ember from 'ember';
import Space from 'ember-contentful/mixins/contentful-space';
import ContentTypes from 'ember-contentful/mixins/contentful-content-types';
import Entries from 'ember-contentful/mixins/contentful-entries';
import Validations from 'ember-contentful/mixins/contentful-validations';

export
default Ember.Component.extend(Space, ContentTypes, Entries, Validations, {

  // --- public interface

  contentTypeId: null,
  entry: null,
  locale: 'en-US',

  isPublished: Ember.computed.notEmpty('entry.sys.publishedAt'), // was this Entry published?
  isArchived: Ember.computed.notEmpty('entry.sys.publishedAt'), // was this Entry archived?
  isUpdated: Ember.computed('entry.sys.publishedAt', 'entry.sys.updatedAt', function() { // was this Entry updated since publishing it?
    var published = this.get('entry.sys.publishedAt');
    var updated = this.get('entry.sys.updatedAt');
    if (published) {
      return updated >= published;
    } else {
      return false;
    }
  }),

  // ---- private stuff

  _contentType: null,

  setupComponent: function() {
    var self = this;
    var contentTypeId = this.get('contentTypeId');
    if (contentTypeId) {
      this
        .getContentType(contentTypeId)
        .then(function(contentType) {
          self.set('_contentType', contentType);
          self.setupProperties();
          self.setupValidations();
        });
    }
  }.on('init'),

  setupProperties: function() {
    var self = this;
    var contentType = this.get('_contentType');
    var locale = this.get('locale');

    if (contentType.fields && Ember.isArray(contentType.fields)) {
      contentType.fields.forEach(function(field) {
        self.set(field.apiName, Ember.computed.alias('entry.fields.' + field.apiName + '.' + locale));
      });
    } else {
      console.warn('Cannot setup properties on ContentfulEntry component, since contentType.fields is not an array... ', contentType);
    }
  },

  setupValidations: function() {
    // @todo setup integrated validations based on the rules given in the contentType
  },

  localeDidChange: function() {
    this.setupProperties(); // change the aliases to point to the new locale
  }.observes('locale'),

  // implicit API's:
  // -> saveEntry(entry)
  // -> publishEntry(entry)
  // -> unpublishEntry(entry)
  // -> archiveEntry(entry)
  // -> validateEntry(entry) --- needs to be done

});
