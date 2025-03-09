import { Observable, Subject } from "rxjs";
import logger from "../../../utils/logging";

let websocketInstance;
const websocketSubjectMap = new Map();
const websocketSubscriptionCountMap = new Map();

export const initWebSocket = (uuid) => {
    websocketInstance = new WebSocket(`wss://your-websocket-url?uuid=${uuid}`);
    websocketInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const channelName = data.channel;
        if (websocketSubjectMap.has(channelName)) {
            websocketSubjectMap.get(channelName).next(data);
        }
    };
    websocketInstance.onerror = (error) => {
        logger.error("WebSocket error:", error);
    };
};

export const subscribeWebSocket = (channelName) => {
    if (!websocketInstance) {
        return logger.warn("WebSocket is not yet instantiated");
    }
    if (!websocketSubjectMap.has(channelName)) {
        websocketSubjectMap.set(channelName, new Subject());
        websocketSubscriptionCountMap.set(channelName, 0);
    }
    websocketInstance.send(JSON.stringify({ action: "subscribe", channel: channelName }));
};

export const getWebSocket = (channelName) => {
    if (!websocketSubjectMap.has(channelName)) {
        subscribeWebSocket(channelName);
    }
    const subject = websocketSubjectMap.get(channelName);

    websocketSubscriptionCountMap.set(channelName, (websocketSubscriptionCountMap.get(channelName) || 0) + 1);

    return new Observable((subscriber) => {
        const subscription = subject.subscribe(subscriber);

        return () => {
            subscription.unsubscribe();

            const newCount = (websocketSubscriptionCountMap.get(channelName) || 1) - 1;
            if (newCount <= 0) {
                unsubscribeWebSocket(channelName);
            } else {
                websocketSubscriptionCountMap.set(channelName, newCount);
            }
        };
    });
};

export const unsubscribeWebSocket = (channelName) => {
    if (!websocketInstance) {
        return logger.warn("WebSocket not yet instantiated");
    }
    if (!websocketSubjectMap.has(channelName)) {
        return logger.warn(`Channel "${channelName}" is not subscribed`);
    }

    websocketInstance.send(JSON.stringify({ action: "unsubscribe", channel: channelName }));

    websocketSubjectMap.get(channelName).complete();
    websocketSubjectMap.delete(channelName);
    websocketSubscriptionCountMap.delete(channelName);

    logger.info(`Auto-unsubscribed from channel: ${channelName}`);
};