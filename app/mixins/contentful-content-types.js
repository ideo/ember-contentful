import Ember from 'ember';
import config from '../config/environment';
import ContentTypeMixin from 'ember-contentful/mixins/contentful-content-types';

var ContentfulMixin = Ember.Mixin.create(ContentTypeMixin, {
  contentTypeMap: config.Contentful.contentTypeMap,
  contentTypeMapNames: window._.invert(config.Contentful.contentTypeMap)
});

export
default ContentfulMixin;
