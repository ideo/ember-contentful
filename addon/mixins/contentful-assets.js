import Ember from 'ember';
import Spaces from 'ember-contentful/mixins/contentful-space';

var ContentfulMixin = Ember.Mixin.create(Spaces, {

  // private function
  // expects an asset field with localisations
  updateAssetWithFile: function(asset, file, locale) {
    if (!Ember.get(asset, locale + '.fields')) {
      Ember.set(asset, locale + '.fields', {});
    }
    if (!Ember.get(asset, locale + '.fields.file')) {
      Ember.set(asset, locale + '.fields.file', {});
    }
    if (!Ember.get(asset, locale + '.fields.title')) {
      Ember.set(asset, locale + '.fields.title', {});
    }
    Ember.set(asset, locale + '.fields.title.' + locale, file.filename);
    Ember.set(asset, locale + '.fields.file.' + locale, {
      contentType: file.mimetype,
      fileName: file.filename,
      upload: file.url
    });
    return this.saveAsset(asset[locale]);
  },

  createAsset: function(locale) {
    return this.connectSpace()
      .then(function(space) {
        var fields = {
          title: {},
          file: {}
        };
        fields.title[locale] = '';
        fields.file[locale] = {};
        return space.createAsset({
          fields: fields
        });
      });
  },

  // save the non-File fields of an Asset (i.e. title, description)
  // this function aspects a raw Asset
  // @todo we might think about unifying this function with `changeAsset`
  saveAsset: function(asset) {
    var copy = _.clone(asset);
    if (copy.is) {
      delete copy.is;
    }
    return this.connectSpace()
      .then(function(space) {
        return space
          .updateAsset(copy)
          .then(function(nextVersion) {
            Ember.set(asset, 'sys', nextVersion.sys);
            return asset;
          })
          .
        catch (function(error) {
          alert("Error saving Asset: " + error);
        });
      });
  },

  // change the File associated with an Asset
  // this function expects an asset field with localisations
  changeAsset: function(assetField, file, locale) {
    var self = this;
    if (assetField && Ember.get(assetField, locale + '.sys') && Ember.get(assetField, locale + '.sys.id')) {
      return this.connectSpace()
        .then(function(space) {
          return self.updateAssetWithFile(assetField, file, locale)
            .then(function(updatedAsset) {
              return space.processAssetFile(updatedAsset, locale)
                .then(function() {
                  // set "processing" flag on the asset in the meantime
                  Ember.set(assetField, locale, updatedAsset);
                  Ember.set(assetField, locale + '.is', {
                    processing: true
                  });

                  // start a polling timer to listen for the processed file version
                  self.watchAsset(assetField, locale);
                  return updatedAsset;
                });
            });
        });
    } else {
      alert("ERROR: No Asset provided in block data! Looks like this block wasn't created properly");
    }
  },

  // private function
  // this function expects an asset field with localisations
  watchAsset: function(asset, locale) {
    Ember.run.later(this, function(asset, locale) {
      var self = this;

      this.connectSpace()
        .then(function(space) {
          space
            .getAsset(asset[locale].sys.id)
            .then(function(polledAsset) {
              if (polledAsset.fields.file[locale].upload) {
                // still processing, poll again later
                self.watchAsset(asset, locale);
                return true;
              }
              if (polledAsset.fields.file[locale].url) {
                // asset finished processing, great, let's update the view
                Ember.set(asset, locale, polledAsset);
                if (Ember.get(asset, locale + '.is.processing')) {
                  Ember.set(asset, locale + '.is.processing', false);
                }
                return true;
              }
              // @todo: handle what happens when a watched asset's data seems to be neither processing nor done...
              alert("The recently uploaded file seems to be stuck in the image processing pipeline. You could try uploading a new file or go to the Contentful editor and see if you can fix it.");
            });
        });
    }, asset, locale, 2000);
  },

  // this function expects an asset field with localisations
  smartImageUrl: function(asset, locale, maxWidth) {
    // maximum image width 1000 pixel, otherwise request downscaled image from API
    if (asset && Ember.get(asset, locale + '.fields.file.' + locale + '.url')) {
      if (Ember.get(asset, locale + '.fields.file.' + locale + '.details.image.width') > maxWidth) {
        return Ember.get(asset, locale + '.fields.file.' + locale + '.url') + '?w=' + maxWidth;
      } else {
        return Ember.get(asset, locale + '.fields.file.' + locale + '.url');
      }
    }
    return false;
  },

  // this function expects an asset field with localisations
  aspectRatio: function(asset, locale) {
    if (asset && Ember.get(asset, locale + '.fields.file.' + locale + '.url')) {
      if (Ember.get(asset, locale + '.fields.file.' + locale + '.details.image.width') && Ember.get(asset, locale + '.fields.file.' + locale + '.details.image.width')) {
        return Ember.get(asset, locale + '.fields.file.' + locale + '.details.image.height') / Ember.get(asset, locale + '.fields.file.' + locale + '.details.image.width');
      }
    }
    return 1;
  }
});

export
default ContentfulMixin;
