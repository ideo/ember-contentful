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
  * `contentful-content-types`
  * `contentful-entries`
  * `contentful-assets`
  * `contentful-validations`


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
