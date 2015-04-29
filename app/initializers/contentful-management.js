
var ContentfulInitializer = {
  name: 'contentful-management',
  initialize: function( container, application ) {
    application.register( 'contentful:management', window.contentfulManagement, {
      instantiate: false
    } );
    application.inject( 'route', 'contentfulManagement', 'contentful:management' );
    application.inject( 'component', 'contentfulManagement', 'contentful:management' );
  }
};

export
default ContentfulInitializer;
