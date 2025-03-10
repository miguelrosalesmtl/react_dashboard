/**
 * This file is used to create network clients for various application services.
 */

import { createHttpClient} from "./http.client.ts";

const serviceUrl = process.env.REACT_APP_SERVICE_URL;
if (!serviceUrl) {
    throw new Error("REACT_APP_SERVICE_URL is not defined");
}

// Create clients for various services

export const backendClient = createHttpClient(serviceUrl);
