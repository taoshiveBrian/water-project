import { Badge } from '@/components/ui/badge';
import type { ProcessingStatus } from '@/types';

const labels: Record<ProcessingStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Ready',
    failed: 'Failed',
};

export function StatusBadge({ status }: { status: ProcessingStatus }) {
    return (
        <Badge
            variant={
                status === 'failed'
                    ? 'destructive'
                    : status === 'completed'
                      ? 'secondary'
                      : 'outline'
            }
        >
            {labels[status]}
        </Badge>
    );
}
