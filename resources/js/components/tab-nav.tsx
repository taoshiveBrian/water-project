import { cn } from '@/lib/utils';

/**
 * An underlined tab bar. Purely controlled: the parent owns the active tab.
 */
export function TabNav<T extends string>({
    tabs,
    active,
    onChange,
    className,
}: {
    tabs: readonly { id: T; label: string }[];
    active: T;
    onChange: (id: T) => void;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            className={cn('flex gap-1 overflow-x-auto border-b', className)}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active === tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm',
                        active === tab.id
                            ? 'border-foreground font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
