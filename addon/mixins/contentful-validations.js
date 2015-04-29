import Ember from 'ember';

var ContentfulMixin = Ember.Mixin.create({

  // validate assets to check that a file is uploaded
  // async
  validateAssets: function(assets, locale) {
    var errors = [];
    _.each(assets, function(asset) {
      if (!asset.fields.file[locale] || !asset.fields.file[locale].url) {
        errors.push(new Error('Asset (' + (asset.fields.title[locale] || asset.sys.id) + ' has no file uploaded.'));
      }
    });
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (errors.length > 0) {
        var error = new Error('Validation error');
        error.details = {
          errors: errors // transform error into a format also used by Contentful
        };
        reject(error);
      }
      resolve(true);
    });
  },

  // iterate over a list of entries and validate them according to their content type definitions (depends on the content-types mixin)
  // async
  validateEntries: function(entries, locale) {
    var promises = [];
    var self = this;
    _.each(entries, function(entry) {
      promises.push(self
        .getContentType(entry.sys.contentType.sys.id)
        .then(function(contentType) {
          return self.validateEntry(entry, contentType, locale);
        }));
    });
    return Ember.RSVP.allSettled(promises)
      .then(function(results) {
        var errors = _.flatten(_.pluck(results, 'value'));
        if (errors.length > 0) {
          var error = new Error('Validation error');
          error.details = {
            errors: errors // transform error into a format also used by Contentful
          };
          throw error;
        }
        return true;
      });
  },

  // validate a single Entry's fields according to the content type definition
  // sync
  validateEntry: function(entry, contentType, locale) {
    if (!contentType) {
      return [
        new Error('No ContentType to validate against')
        ];
    }
    var self = this;
    var errors = [];
    _.each(contentType.fields, function(field) {
      if (field.required && !entry.fields[field.apiName][locale]) {
        errors.push(new Error(field.apiName + ' is required.'));
      }
      // only execute validation rules if the field is present and not empty
      if (entry.fields[field.apiName] && entry.fields[field.apiName][locale] && !_.isEmpty(entry.fields[field.apiName][locale])) {
        if (field.validations) {
          _.each(field.validations, function(rule) {
            var error = self.validateRule(entry.fields[field.apiName][locale], rule, false);
            if (error) {
              errors.push(new Error('Field "' + field.apiName + '": ' + error));
            }
          });
        }
        if (field.items && field.items.validations) {
          _.each(field.items.validations, function(rule) {
            var error = self.validateRule(entry.fields[field.apiName][locale], rule, true);
            if (error) {
              errors.push(new Error('Field "' + field.apiName + '": ' + error));
            }
          });
        }
      }
    });
    return errors;
  },

  // validate a single field
  // sync
  validateRule: function(field, rule, checkItems) {
    var error = false;
    if (rule['in']) {
      if (checkItems) {
        _.each(field, function(item) {
          if (!_.contains(rule['in'], item)) {
            error = 'value "' + item + '" is not allowed';
          }
        });
        if (error) {
          return error;
        }
      } else {
        if (!_.contains(rule['in'], field)) {
          return 'value "' + field + '" is not allowed';
        }
      }
    }
    // @todo: implement more validation rules
    if (rule.size) {}
    if (rule.linkContentType) {}
    return error;
  },

  // translate and concatenate error messages
  // sync
  translateError: function(error) {
    var concatenateErrors = function(errors, title) {
      title = (title || '') + "\n";
      var errorMessages = '';
      _.each(errors, function(err) {
        errorMessages += err.message + "\n";
      });
      return title + errorMessages;
    };

    if (error.sys && error.sys.id) {
      if (error.sys.id === 'VersionMismatch') {
        error.message = "\nSomebody else has edited this document which resulted in a version conflict.\nPlease reload this page to get the latest content.";
      }
    }

    if (error.details && Ember.isArray(error.details.errors)) {
      if (_.findWhere(error.details.errors, {
        name: 'notResolvable'
      })) {
        error.message += "\nThere is a link to an entry that was already deleted. Please go to Contentful and remove the link.";
      }
      if (error.details.errors.length > 0 && error.details.errors[0].message) {
        error.message += concatenateErrors(error.details.errors);
      }
    }
  }
});

export
default ContentfulMixin;
