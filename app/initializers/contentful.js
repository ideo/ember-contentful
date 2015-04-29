import config from '../config/environment';

var client = window.contentful.createClient( {
  host: 'preview.contentful.com',
  accessToken: config.Contentful.previewKey,
  space: config.Contentful.space
} );

var ContentfulInitializer = {
  name: 'contentful',
  initialize: function( container, application ) {
    application.register( 'contentful:preview', client, {
      instantiate: false
    } );
    application.inject( 'route', 'contentful', 'contentful:preview' );
    application.inject( 'component', 'contentful', 'contentful:preview' );
  }
};

export
default ContentfulInitializer;
