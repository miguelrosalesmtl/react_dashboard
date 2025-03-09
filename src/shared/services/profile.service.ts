import {backendClient} from "../network_clients/networkClients.ts";

export const ProfileService = {
    getProfile: (userId: string) => backendClient.get(`/profile/${userId}`),
};