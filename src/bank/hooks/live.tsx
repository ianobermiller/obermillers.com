import { isPbAbort, pb, quoteFilter } from "@bank/core/pb";
import { pbCollections } from "@bank/core/pbCollections";
import { useCallback, useEffect, useRef, useState } from "react";

function ignoreUnsub(unsub: () => void | Promise<void>): void {
  void Promise.resolve(unsub()).catch(() => {});
}

export interface LiveSubscription {
  collection: string;
  filter?: string;
  topic?: string;
}

function parseSubscriptions(raw: string): LiveSubscription[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("collection" in item) ||
      typeof item.collection !== "string"
    ) {
      return [];
    }
    const subscription: LiveSubscription = { collection: item.collection };
    if ("filter" in item && typeof item.filter === "string") {
      subscription.filter = item.filter;
    }
    if ("topic" in item && typeof item.topic === "string") {
      subscription.topic = item.topic;
    }
    return [subscription];
  });
}

export function accountListSubscriptions(): LiveSubscription[] {
  return [{ collection: pbCollections.accounts }, { collection: pbCollections.transactions }];
}

export function accountDetailSubscriptions(accountId: string): LiveSubscription[] {
  const account = quoteFilter(accountId);
  return [
    { collection: pbCollections.accounts, topic: accountId },
    { collection: pbCollections.presets, filter: `account = ${account}` },
    { collection: pbCollections.transactions, filter: `account = ${account}` },
  ];
}

export function useLiveQuery<T>(
  fetcher: () => Promise<T>,
  options: { key?: string; subscribe?: readonly LiveSubscription[] } = {},
): { data: T | undefined; reload: () => void } {
  const { key = "", subscribe = [] } = options;
  const [data, setData] = useState<T | undefined>();
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  const subscribeKey = JSON.stringify(subscribe);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    void fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isPbAbort(error)) {
          reload();
          return;
        }
        console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  useEffect(() => {
    const subscriptions = parseSubscriptions(subscribeKey);
    if (subscriptions.length === 0) {
      return () => {};
    }

    let cancelled = false;
    const unsubs: (() => void | Promise<void>)[] = [];

    void (async () => {
      for (const subscription of subscriptions) {
        try {
          const unsub = await pb.collection(subscription.collection).subscribe(
            subscription.topic ?? "*",
            () => {
              if (!cancelled) reload();
            },
            subscription.filter ? { filter: subscription.filter } : undefined,
          );
          if (cancelled) {
            ignoreUnsub(unsub);
          } else {
            unsubs.push(unsub);
          }
        } catch (error) {
          console.error(`PocketBase subscribe failed for ${subscription.collection}:`, error);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const unsub of unsubs) {
        ignoreUnsub(unsub);
      }
    };
  }, [reload, subscribeKey]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  return { data, reload };
}
