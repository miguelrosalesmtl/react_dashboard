import {FakeProfileService} from "../../shared/services/profile.service.ts";
import {fetchProfileFailure, fetchProfileRequest, fetchProfileSuccess} from "./profile.action.creators.ts";

export const fetchProfile = () => {
    return async (dispatch) => {
        dispatch(fetchProfileRequest());
        try {
            const profile = await FakeProfileService.getProfile();
            dispatch(fetchProfileSuccess(profile));
        } catch (error) {
            dispatch(fetchProfileFailure(error));
        }
    };
};
