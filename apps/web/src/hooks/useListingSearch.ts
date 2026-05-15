"use client";

import { useEffect, useRef, useState } from "react";
import { listingApi, type ListingWithCompany } from "@/src/lib/api";

type State = {
    items: ListingWithCompany[];
    loading: boolean;
};

const PAGE_SIZE = 6;
const DEBOUNCE_MS = 200;

export function useListingSearch(query: string): State {
    const [items, setItems] = useState<ListingWithCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const reqId = useRef(0);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems([]);

            setLoading(false);
            return;
        }

        const id = ++reqId.current;

        setLoading(true);

        const handle = setTimeout(async () => {
            try {
                const res = await listingApi.list({
                    q,
                    page: 1,
                    pageSize: PAGE_SIZE,
                });
                if (reqId.current !== id) return; // stale
                setItems(res.items);
            } catch {
                if (reqId.current === id) setItems([]);
            } finally {
                if (reqId.current === id) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(handle);
    }, [query]);

    return { items, loading };
}
