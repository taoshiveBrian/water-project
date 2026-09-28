import { Separator } from '@/components/ui/separator';
import type { SimpleBody } from '@/types';

/**
 * The main text, then a divider and the additional text. Plain text only: markers
 * aren't interpreted and nothing is injected as HTML.
 */
export function SimpleRenderer({ body }: { body: SimpleBody }) {
    return (
        <div className="grid gap-6">
            <div className="whitespace-pre-line">{body.text}</div>
            {body.text2?.trim() && (
                <>
                    <Separator />
                    <div className="whitespace-pre-line">{body.text2}</div>
                </>
            )}
        </div>
    );
}
