import { applyMode, Mode } from "@cloudscape-design/global-styles";
import "@cloudscape-design/global-styles/index.css";
import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
} from "aws-amplify/auth";
import { RequestOptions } from "https";
import ReactDOM from "react-dom/client";
import xhook from "xhook";
import GlobeGlApp from "./App.tsx";
import { Signer } from "./Signer";
applyMode(Mode.Dark);

const userPoolId = import.meta.env.VITE_USER_POOL_ID!;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID!;
const identityPoolId = import.meta.env.VITE_IDENTITY_POOL_ID!;
const domain = import.meta.env.VITE_USER_POOL_DOMAIN;
const redirectSignIn = import.meta.env.VITE_USER_POOL_REDIRECT_SIGNIN;
const redirectSignOut = import.meta.env.VITE_USER_POOL_REDIRECT_SIGNOUT;

Amplify.configure({
  Auth: {
    Cognito: {
      loginWith: {
        oauth: {
          domain,
          redirectSignIn: [redirectSignIn],
          redirectSignOut: [redirectSignOut],
          scopes: ["email", "profile", "openid"],
          responseType: "code",
        },
      },
      userPoolId,
      userPoolClientId,
      identityPoolId,
    },
  },
});

let currentUser = undefined;
try {
  currentUser = await getCurrentUser();
} catch (error) {
  console.log(error);
}
if (!currentUser) {
  await signInWithRedirect();
}

const session = await fetchAuthSession();

const mapHost = "maps.geo.ap-southeast-2.amazonaws.com";
const mapUrl = `https://${mapHost}/maps/v0/maps/EsriMaps/tiles/{z}/{x}/{y}`;

// Inject an AWS SigV4 signature calculator into any matching XHR Request.
const signer = new Signer(
  session.credentials!.accessKeyId,
  session.credentials!.secretAccessKey,
  session.credentials!.sessionToken!
);
xhook.before((req) => {
  const url = new URL(req.url);
  if (url.host === mapHost) {
    const opts: RequestOptions = {
      headers: req.headers,
      method: req.method,
      host: url.host,
      hostname: url.hostname,
      path: url.pathname,
    };
    signer.sign(opts);
    req.headers["Authorization"] = opts.headers!["Authorization"] as string;
    req.headers["X-Amz-Date"] = opts.headers!["X-Amz-Date"] as string;
    req.headers["X-Amz-Security-Token"] = opts.headers![
      "X-Amz-Security-Token"
    ] as string;
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  currentUser ? <GlobeGlApp mapUrl={mapUrl} /> : <p>{"Not Authenticated"}</p>
  // </React.StrictMode>
);
