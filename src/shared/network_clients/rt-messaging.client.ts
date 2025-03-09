import PubNub, { MessageEvent, PubnubConfig } from "pubnub";
import { PUBNUB_STATIC_CHANNELS } from "../../../utils/constants";
import logger from "../../../utils/logging";
import { Observable, Subject } from "rxjs";
import { useEffect, useState } from "react";

// Singleton state to be shared across all hook instances
let pubnubInstance: PubNub | null = null;
const subjectMap = new Map<string, Subject<MessageEvent>>();
const subscriptionCountMap = new Map<string, number>();
const registeredHandlers: string[] = [];

/**
 * Initialize the PubNub client
 */
export function initPubnub(uuid: string): PubNub {
    if (!pubnubInstance) {
        const pubnubConfig: PubnubConfig = {
            uuid,
            publishKey: window?.env?.PUBNUB_PUBLISH_KEY,
            subscribeKey: window?.env?.PUBNUB_SUBSCRIBE_KEY,
            restore: true,
        };
        pubnubInstance = new PubNub(pubnubConfig);
        logger.info("PubNub client initialized");
    }
    return pubnubInstance;
}

/**
 * Register a message handler for a specific channel
 */
function registerHandler(channelName: string) {
    if (!pubnubInstance) {
        logger.warn("PubNub not yet instantiated");
        return;
    }

    if (registeredHandlers.includes(channelName)) {
        return;
    }

    pubnubInstance.addListener({
        message: (data: MessageEvent) => {
            if (subjectMap.has(channelName)) {
                subjectMap.get(channelName)?.next(data);
            }
        },
    });

    registeredHandlers.push(channelName);
}

/**
 * Subscribe to a PubNub channel
 */
export function subscribeToChannel(channelName: string) {
    if (!pubnubInstance) {
        logger.warn("PubNub is not yet instantiated");
        return;
    }

    if (!subjectMap.has(channelName)) {
        subjectMap.set(channelName, new Subject<MessageEvent>());
        subscriptionCountMap.set(channelName, 0);
        registerHandler(channelName);
    }

    pubnubInstance.subscribe({ channels: [channelName] });
}

/**
 * Get an Observable for messages on a specific channel
 */
export function getChannelObservable(channelName: string): Observable<MessageEvent> {
    if (!subjectMap.has(channelName)) {
        subscribeToChannel(channelName);
    }

    const subject = subjectMap.get(channelName)!;

    // Increase subscription count
    subscriptionCountMap.set(channelName, (subscriptionCountMap.get(channelName) || 0) + 1);

    return new Observable<MessageEvent>((subscriber) => {
        const subscription = subject.subscribe(subscriber);

        return () => {
            subscription.unsubscribe();
            // Decrease subscription count
            const newCount = (subscriptionCountMap.get(channelName) || 1) - 1;
            if (newCount <= 0) {
                unsubscribeFromChannel(channelName);
            } else {
                subscriptionCountMap.set(channelName, newCount);
            }
        };
    });
}

/**
 * Unsubscribe from a PubNub channel
 */
export function unsubscribeFromChannel(channelName: string) {
    if (!pubnubInstance) {
        logger.warn("PubNub not yet instantiated");
        return;
    }

    if (!subjectMap.has(channelName)) {
        logger.warn(`Channel "${channelName}" is not subscribed`);
        return;
    }

    // Unsubscribe from PubNub
    pubnubInstance.unsubscribe({ channels: [channelName] });

    // Complete and remove the Subject
    subjectMap.get(channelName)!.complete();
    subjectMap.delete(channelName);
    subscriptionCountMap.delete(channelName);

    // Remove from registeredHandlers
    const index = registeredHandlers.indexOf(channelName);
    if (index !== -1) {
        registeredHandlers.splice(index, 1);
    }

    logger.info(`Unsubscribed from channel: ${channelName}`);
}

/**
 * DEPRECATED
 * Subscribe to PubNub Global Channels
 */
export function subscribeToPubNubGlobalChannels(account_uid: string, worker_sid: string, handler: () => void) {
    const channel = `${PUBNUB_STATIC_CHANNELS.GLOBAL_CONFERENCES}.${account_uid}-${worker_sid}`;
    subscribeToChannel(channel);
    handler();
}

/**
 * React hook for initializing PubNub
 */
export function usePubnubInit(uuid?: string) {
    const [isInitialized, setIsInitialized] = useState(!!pubnubInstance);

    useEffect(() => {
        if (!uuid || isInitialized) return;

        try {
            initPubnub(uuid);
            setIsInitialized(true);
        } catch (error) {
            logger.error("Error initializing PubNub:", error);
        }

    }, [uuid, isInitialized]);

    return isInitialized;
}

/**
 * React hook for subscribing to a channel and receiving messages
 */
export function useChannel<T = any>(channelName: string) {
    const [messages, setMessages] = useState<T[]>([]);
    const [lastMessage, setLastMessage] = useState<T | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!channelName || !pubnubInstance) return;

        const observable = getChannelObservable(channelName);

        const subscription = observable.subscribe({
            next: (event: MessageEvent) => {
                const message = event.message as T;
                setLastMessage(message);
                setMessages(prev => [...prev, message]);
            },
            error: (err) => {
                logger.error(`Error in channel ${channelName}:`, err);
            }
        });

        setIsSubscribed(true);

        return () => {
            subscription.unsubscribe();
            setIsSubscribed(false);
        };
    }, [channelName]);

    const publishMessage = (message: any) => {
        if (!pubnubInstance || !channelName) {
            logger.warn("Cannot publish: PubNub not initialized or no channel specified");
            return Promise.reject("PubNub not initialized or no channel specified");
        }

        return pubnubInstance.publish({
            channel: channelName,
            message
        });
    };

    const clearMessages = () => {
        setMessages([]);
        setLastMessage(null);
    };

    return {
        messages,
        lastMessage,
        isSubscribed,
        publishMessage,
        clearMessages
    };
}

/**
 * High-level hook that handles initialization and subscription in one place
 */
export function usePubnubChannel<T = any>(channelName: string, uuid?: string) {
    const isInitialized = usePubnubInit(uuid);
    const channelState = useChannel<T>(isInitialized ? channelName : "");

    return {
        ...channelState,
        isReady: isInitialized && channelState.isSubscribed
    };
}