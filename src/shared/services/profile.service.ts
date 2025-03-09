import {backendClient} from "../network_clients/networkClients.ts";
import {PROFILE_PATH} from "./services.constants.ts";

export const ProfileService = {
    getProfile: () => backendClient.get(PROFILE_PATH),
};