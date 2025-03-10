import {backendClient} from "../../core/network_clients/networkClients.ts";
import {PROFILE_PATH} from "./services.constants.ts";

export const ProfileService = {
    getProfile: () => backendClient.get(PROFILE_PATH),
};

export const FakeProfileService = {
    getProfile: () => Promise.resolve({
        username: "miguelros",
        email: "miguel.f.rosales@gmail.com",
        first_name: "Miguel",
        last_name: "Rosales",
        router: [
            {title: "Admin", path: "/", component: "HomeComponent"},
        ],

    }),
}