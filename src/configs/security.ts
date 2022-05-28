import csp from "content-security-policy";
import { Express } from "express";
import PP from "permissions-policy";
import RP from "referrer-policy";
import sts from "strict-transport-security";
import XFP from "x-frame-options";
import rateLimit from "express-rate-limit";
import { env } from "../configs";
import { response } from "../helpers";

export const lock = (app: Express) => {
  if (env.env !== "development") {
    app.enable("trust proxy");
    app.use((req, res, next) => (req.secure
      ? next()
      : res.redirect(`https://${req.headers.host}${req.url}`)));
  }
  const STS = sts.getSTS({
    "max-age": { days: 365 },
    includeSubDomains: true,
    preload: true,
  });
  app.use(STS);
  const CSP = csp.getCSP(csp.STARTER_OPTIONS);
  app.use(CSP);
  app.use(XFP());
  app.use(RP());
  app.use(
    PP({
      features: {
        accelerometer: ["none"],
        ambientLightSensor: ["none"],
        autoplay: ["none"],
        battery: ["none"],
        camera: ["none"],
        displayCapture: ["none"],
        documentDomain: ["none"],
        documentWrite: ["none"],
        encryptedMedia: ["none"],
        executionWhileNotRendered: ["none"],
        executionWhileOutOfViewport: ["none"],
        fontDisplayLateSwap: ["none"],
        fullscreen: ["none"],
        geolocation: ["none"],
        gyroscope: ["none"],
        interestCohort: ["none"],
        layoutAnimations: ["none"],
        legacyImageFormats: ["none"],
        loadingFrameDefaultEager: ["none"],
        magnetometer: ["none"],
        microphone: ["none"],
        midi: ["none"],
        navigationOverride: ["none"],
        notifications: ["none"],
        oversizedImages: ["none"],
        payment: ["none"],
        pictureInPicture: ["none"],
        publickeyCredentials: ["none"],
        push: ["none"],
        serial: ["none"],
        speaker: ["none"],
        syncScript: ["none"],
        syncXhr: ["none"],
        unoptimizedImages: ["none"],
        unoptimizedLosslessImages: ["none"],
        unoptimizedLossyImages: ["none"],
        unsizedMedia: ["none"],
        usb: ["none"],
        verticalScroll: ["none"],
        vibrate: ["none"],
        vr: ["none"],
        wakeLock: ["none"],
        xr: ["none"],
        xrSpatialTracking: ["none"],
      },
    }),
  );
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => response(
      res,
      { status: false, message: options.message },
      options.statusCode,
    ),
  });
  app.use(limiter);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
};
