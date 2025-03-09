import PubNub, { MessageEvent, PubnubConfig } from "pubnub";
import { Observable, Subject } from "rxjs";
import logger from "../../../utils/logging";

let pubnubInstance;
const pubnubSubjectMap = new Map();
const pubnubSubscriptionCountMap = new Map();
let pubnubRegisteredHandlers = [];

export const initPubNub = (uuid) => {
    if (!pubnubInstance) {
        const pubnubConfig = {
            uuid,
            publishKey: window?.env?.PUBNUB_PUBLISH_KEY,
            subscribeKey: window?.env?.PUBNUB_SUBSCRIBE_KEY,
            restore: true,
        };

        pubnubInstance = new PubNub(pubnubConfig);
    }
    if (!pubnubInstance) {
        logger.error("Error initializing PubNub");
    }
};

export const subscribePubNub = (channelName) => {
    if (!pubnubInstance) {
        return logger.warn("PubNub is not yet instantiated");
    }
    if (!pubnubSubjectMap.has(channelName)) {
        pubnubSubjectMap.set(channelName, new Subject());
        pubnubSubscriptionCountMap.set(channelName, 0);
        registerPubNubHandler(channelName);
    }
    pubnubInstance.subscribe({ channels: [channelName] });
};

export const getPubNub = (channelName) => {
    if (!pubnubSubjectMap.has(channelName)) {
        subscribePubNub(channelName);
    }
    const subject = pubnubSubjectMap.get(channelName);

    pubnubSubscriptionCountMap.set(channelName, (pubnubSubscriptionCountMap.get(channelName) || 0) + 1);

    return new Observable((subscriber) => {
        const subscription = subject.subscribe(subscriber);

        return () => {
            subscription.unsubscribe();

            const newCount = (pubnubSubscriptionCountMap.get(channelName) || 1) - 1;
            if (newCount <= 0) {
                unsubscribePubNub(channelName);
            } else {
                pubnubSubscriptionCountMap.set(channelName, newCount);
            }
        };
    });
};

export const unsubscribePubNub = (channelName) => {
    if (!pubnubInstance) {
        return logger.warn("PubNub not yet instantiated");
    }
    if (!pubnubSubjectMap.has(channelName)) {
        return logger.warn(`Channel "${channelName}" is not subscribed`);
    }

    pubnubInstance.unsubscribe({ channels: [channelName] });

    pubnubSubjectMap.get(channelName).complete();
    pubnubSubjectMap.delete(channelName);
    pubnubSubscriptionCountMap.delete(channelName);

    pubnubRegisteredHandlers = pubnubRegisteredHandlers.filter((ch) => ch !== channelName);

    logger.info(`Auto-unsubscribed from channel: ${channelName}`);
};

const registerPubNubHandler = (channelName) => {
    if (!pubnubInstance) return logger.warn("PubNub not yet instantiated");
    if (pubnubRegisteredHandlers.includes(channelName)) return;

    pubnubInstance.addListener({
        message: (data) => {
            if (pubnubSubjectMap.has(channelName)) {
                pubnubSubjectMap.get(channelName).next(data);
            }
        },
    });

    pubnubRegisteredHandlers.push(channelName);
};