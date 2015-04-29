/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-contentful',

  included: function(app) {
    this._super.included(app);

    app.import('bower_components/contentful/dist/contentful.js');
    app.import('vendor/contentful/contentful-management.js');
  }
};
