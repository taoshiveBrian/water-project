import { linkify } from '@/components/articles/inline-links';
import { Separator } from '@/components/ui/separator';
import type { SimpleBody } from '@/types';

/**
 * The main text, then a divider and the additional text. Plain text with clickable
 * links: image markers aren't interpreted and nothing is injected as HTML.
 */
export function SimpleRenderer({ body }: { body: SimpleBody }) {
    return (
        <div className="grid gap-6">
            <div className="whitespace-pre-line">{linkify(body.text)}</div>
            {body.text2?.trim() && (
                <>
                    <Separator />
                    <div className="whitespace-pre-line">
                        {linkify(body.text2, 'text2')}
                    </div>
                </>
            )}
        </div>
    );
}
