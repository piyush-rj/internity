import { PiUsersFill } from "react-icons/pi";

export default function AdminFoundersPage() {
    return (
        <ComingSoon
            title="Founders"
            description="Every verified founder, searchable. Coming next."
            Icon={PiUsersFill}
        />
    );
}

function ComingSoon({
    title,
    description,
    Icon,
}: {
    title: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <section className="px-6 py-10">
            <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-[15px] font-semibold">{title}</h2>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                    {description}
                </p>
            </div>
        </section>
    );
}
