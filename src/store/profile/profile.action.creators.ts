import {
    FETCH_PROFILE_REQUEST,
    FETCH_PROFILE_SUCCESS,
    FETCH_PROFILE_FAILURE,
} from './profile.action.types.ts';

export const fetchProfileRequest = () => ({
    type: FETCH_PROFILE_REQUEST,
});

export const fetchProfileSuccess = (profile: any) => ({
    type: FETCH_PROFILE_SUCCESS,
    payload: profile,
});

export const fetchProfileFailure = (error: any) => ({
    type: FETCH_PROFILE_FAILURE,
    payload: error,
});


