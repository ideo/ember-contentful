# Ember Contentful addon

Ember Contentful is an Ember CLI addon that should facilitate working with Contentful's Content Management API.


## Basics

Alright, this repo is missing a *lot* of documentation and I'm afraid that a the structure and encapsulation of this addon and it's dependencies still needs a lot of work, but... it's a start.

What is in this addon:

* Initializer: a simple initializer setting up `contentful` and `contentful-management` and injecting them into Routes and Components

* Authenticator: A custom `authenticator` based on the Ember Simple Auth package. 

* Routes:
  * `auth/contentful` as a callback route for the Contentful API
  * `contentful-entry` as a base template for a Route that loads an Entry from Contentful

* Mixins:
  * `contentful-space`
    * `connectSpace()` - async function returning a Promise that resolves to a Contentful 		`space`. The function uses the space ID and the authentication token from the current 		`session`.
  * `contentful-content-types`
    * `loadContentTypes` - async function returning a Promise that resolves to the content types loaded from the Contentful API. The function uses the space ID and auth token from the current user session. The return value is a hash/map in the form of `{ typeId : { ...fields }, ... }`. When loading the content types the HTTP header `X-Contentful-Skip-Transformation: true` is used, so that the response contains the field ID and the field name.
    * `getContentType( id )` - async function returning a Promise that resolves to a single content type object. It expects the ID of the content type as a parameter.
    * `ensureContentFieldsArePresent( entry, locale )` - async func returning a Promise that resolves to an Entry with all properties defined in the content type set (even if empty). Normally Contentful's API responses skip empty fields altogether, but for Ember's Observers and Computed Properties to work we need at least an empty object to bind against. So this function prepares an `Entry` to be used in an Ember environment.
    * `getContentTypeName( id )` - maps a content type's Id to it's apiName/field name. This function uses the map currently expected in `config/environment`. A likely use case is to auto-generate route names from content type ids.
    * `getContentTypeId( name )` - maps a content type's name to it's Contentful ID. This function uses the map currently expected in `config/environment`. A likely use case would be to map a route name to an API request that needs the content type id.
  * `contentful-entries`
    * `getEditorUI( contentTypeId )`
    * `reduceEntriesToLinks( entry, locale)`
    * `resolveAssets(entries, assets)`
    * `listEntryChildren(entry, hash includedTypes, locale)`
    * `publishEntryWithChildren(entry, includedTypes, controller)`
    * `publishEntry(entry)`
    * `unpublishEntry(entry)`
    * `archiveEntry(entry)`
  * `contentful-assets`
    * `createAsset(locale)`
    * `updateAssetWithFile(asset, file, locale)`
    * `saveAsset(asset)`
    * `changeAsset(assetField, file, locale)`
    * `watchAsset(asset, locale)`
    * `smartImageUrl(asset, locale, maxWidth)`
    * `aspectRatio(asset, locale)`
  * `contentful-validations`
    * `validateAssets(assets, locale)`
    * `validateEntries(entries, locale)`
    * `validateEntry(entry, contentType, locale)`
    * `validateRule(field, rule, checkItems)`
    * `translateError(error)`


## Installation

* `ember install ember-contentful`

Don't forget the dependencies...

* `ember install ember-cli-simple-auth`
* `ember install ember-cli-simple-auth-oauth2`
* `bower install lodash` and add it to your Brocfile (better solution to come)

### Configuration

You'll need a lot of stuff in your config file for this addon:

```javascript
  var ENV = {
	// ...
    Contentful: {
      clientId: 'xxxx',
      redirectUrl: 'http://localhost:4200/auth/contentful',
      deliveryKey: 'xxxx',
      previewKey: 'xxxx',
      host: 'https://api.contentful.com/',
      previewHost: 'https://preview.contentful.com/',
      space: 'xxxx',

      contentTypeMap: {
        'xxxx': 'name',
        // ...
      }
    }

```


## Developers

### Install

* `git clone` this repo
* `npm install` 
* `bower install`

### Running

* `ember server`
* Visit your app at http://localhost:4200.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
