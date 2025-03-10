import { Observable, Subject } from "rxjs";
// import logger from "../../../utils/logging";

let sseInstance: EventSource;
const sseSubjectMap = new Map();
const sseSubscriptionCountMap = new Map();

export const initSSE = (uuid: string) => {
    sseInstance = new EventSource(`https://your-sse-url?uuid=${uuid}`);
    sseInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const channelName = data.channel;
        if (sseSubjectMap.has(channelName)) {
            sseSubjectMap.get(channelName).next(data);
        }
    };
    sseInstance.onerror = (error) => {
        console.error(error);
        // logger.error("SSE error:", error);
    };
};

export const subscribeSSE = (channelName: string) => {
    if (!sseInstance) {
        console.error("SSE not yet instantiated");
        // return logger.warn("SSE is not yet instantiated");
    }
    if (!sseSubjectMap.has(channelName)) {
        sseSubjectMap.set(channelName, new Subject());
        sseSubscriptionCountMap.set(channelName, 0);
    }
    // No need to send a subscribe message for SSE, as it is handled by the server
};

export const getSSE = (channelName: string) => {
    if (!sseSubjectMap.has(channelName)) {
        subscribeSSE(channelName);
    }
    const subject = sseSubjectMap.get(channelName);

    sseSubscriptionCountMap.set(channelName, (sseSubscriptionCountMap.get(channelName) || 0) + 1);

    return new Observable((subscriber) => {
        const subscription = subject.subscribe(subscriber);

        return () => {
            subscription.unsubscribe();

            const newCount = (sseSubscriptionCountMap.get(channelName) || 1) - 1;
            if (newCount <= 0) {
                unsubscribeSSE(channelName);
            } else {
                sseSubscriptionCountMap.set(channelName, newCount);
            }
        };
    });
};

export const unsubscribeSSE = (channelName: string) => {
    if (!sseInstance) {
        console.error("SSE not yet instantiated");
        // return logger.warn("SSE not yet instantiated");
    }
    if (!sseSubjectMap.has(channelName)) {
        console.error(`Channel "${channelName}" is not subscribed`);
        //return logger.warn(`Channel "${channelName}" is not subscribed`);
    }

    // No need to send an unsubscribe message for SSE, as it is handled by the server

    sseSubjectMap.get(channelName).complete();
    sseSubjectMap.delete(channelName);
    sseSubscriptionCountMap.delete(channelName);

    // logger.info(`Auto-unsubscribed from channel: ${channelName}`);
};