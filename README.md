## CesiumJS Demo with React and Amazon Location Service

This is simple demo of using Amazon Location Service maps with CesiumJS and React.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Introduction

This is a client-side only demonstration of how use Amazon Location Service maps with CesiumJS and React. The main features of this demo are:

- Amazon Location Services Maps
- AWS IAM SigV4 for authentication and authorisation
- CesiumJS for display of the Earth
- React web framework
- Typescript language usage

## Amazon Location Service

Amazon Location Service provides a map tile service that can serve map tiles. The tile come from a data provider and in this example we have chosen and ESRI map tile data provider. You can also do this yourself by logging into your AWS account, navigating to Amazon Location Service and nagivating to [Create Map](https://ap-southeast-2.console.aws.amazon.com/location/maps/home?region=ap-southeast-2#/create). This demo assumes use of the `ap-southeast-2` region (Sydney) but you can use any region where the Amazon Location Service is supported. This demo assumes you create an ESRI map source with the name `EsriMaps`. Once this is done, the map tiles are served via a URL of the form:

`https://maps.geo.ap-southeast-2.amazonaws.com/maps/v0/maps/EsriMaps/tiles/{z}/{x}/{y}`

This endpoint is protected by default using AWS SigV4 authentication - just like the majority of AWS Web Service endpoints. In order to request a map tile using a HTTP GET, the GET request must be prioperly signed using the SigV4 algorithm. Typically you use the AWS SDK to invoke AWS APIs, and the SDK takes care of signing the requests for you using AWS credentials. Since we will be using CesiumJS to request tiles on opur behalf, we need to intercept the map tile requests and sign them otherwise Amazon Location Service will reject the requests as unauthorized as it should.

Amazon Location Service also supports Cognito and API Keys as alternative authentication mechanisms. This demo will cover IAM SigV4 only.

## CesiumJS

CesiumJS supports map tile providers via implementation of an `ImageryProvider` interface. Here we use the `UrlTemplateImageryProvider` with the URL of our Amazon Location Service map resource. We create the `ImageryProvider` like this:

```javascript
const tms = new UrlTemplateImageryProvider({
  url: mapUrl,
  tilingScheme: new WebMercatorTilingScheme({
    numberOfLevelZeroTilesX: 1,
    numberOfLevelZeroTilesY: 1,
  }),
  maximumLevel: 17,
});
```

The `UrlTemplateImageryProvider` will make asynchronous HTTP requests for tiles on our behalf. As above, we need to make sure those requests are signed with SigV4. To do that we hook (using [XHook](https://github.com/jpillora/xhook)) into the Browser API XHR and add the signature like this:

```
xhook.before((req) => {
  // sign the request
})
```

## Running the Demo

To run the demo first you will need to install the dependencies as follows depending on npm or pnpm usage:

```
npm install
```

Then change the map url to suit your own Amazon Location Service map resource.

```javascript
const mapUrl = `https://${mapHost}/maps/v0/maps/EsriMaps/tiles/{z}/{x}/{y}`;
```

Then run the demo:

```
npm run dev
```

The demo uses a Cognito User Pool and linked Identity Pool. The AWS Amplify library is used to get retrieve temporary AWS credentials for retrieving map tiles from Amazon Location Service. You will need to create both pools and provide their details in a `.env.local` file when running locally.

```
VITE_USER_POOL_ID="ap-southeast-2_xxxxxxxxx"
VITE_USER_POOL_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_IDENTITY_POOL_ID="ap-southeast-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
VITE_USER_POOL_DOMAIN="xxxxxxxxxxxxxxxxx.auth.ap-southeast-2.amazoncognito.com"
VITE_USER_POOL_REDIRECT_SIGNIN="http://localhost:5173"
VITE_USER_POOL_REDIRECT_SIGNOUT="http://localhost:5173"
```
