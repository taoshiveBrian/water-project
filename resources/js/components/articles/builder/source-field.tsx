import { useSectionsScope } from '@/components/articles/builder/sections-scope';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SourceField() {
    const { sourceLabel, sourceUrl, setSourceLabel, setSourceUrl } =
        useSectionsScope();

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
                <Label>Source name</Label>
                <Input
                    value={sourceLabel}
                    onChange={(event) => setSourceLabel(event.target.value)}
                    placeholder="USGS Water Data"
                    maxLength={255}
                />
            </div>
            <div className="grid gap-2">
                <Label>Source URL</Label>
                <Input
                    type="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://"
                />
            </div>
        </div>
    );
}
