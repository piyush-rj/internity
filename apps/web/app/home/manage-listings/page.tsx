"use client";

import { ListingsBoard } from "@/src/components/manage-listings/ListingsBoard";

export default function ManageListingsPage() {
    return (
        <ListingsBoard
            scope="mine"
            title="My listings"
            description="Internships and jobs you’ve posted."
        />
    );
}
