import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import AlertError from '@/components/alert-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update } from '@/routes/media/settings';
import type {
    MediaSettings,
    MediaSize,
    PhpLimits,
    ProcessingMethod,
} from '@/types';

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="grid gap-4 rounded-xl border p-4 md:p-5">
            <h3 className="font-medium">{title}</h3>
            {children}
        </section>
    );
}

function Toggle({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <label className="flex items-start gap-3 text-sm">
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
                className="mt-0.5"
            />
            <span className="grid gap-0.5">
                <span className="font-medium">{label}</span>
                {hint && <span className="text-muted-foreground">{hint}</span>}
            </span>
        </label>
    );
}

export function MediaSettingsForm({
    settings,
    supportedMimeTypes,
    phpLimits,
}: {
    settings: MediaSettings;
    supportedMimeTypes: string[];
    phpLimits: PhpLimits;
}) {
    const form = useForm<MediaSettings>({ ...settings });
    const { data, setData } = form;

    const setSize = (index: number, patch: Partial<MediaSize>) =>
        setData(
            'sizes',
            data.sizes.map((size, position) =>
                position === index ? { ...size, ...patch } : size,
            ),
        );

    const numberOrNull = (value: string) =>
        value === '' ? null : Number(value);

    return (
        <form
            className="grid max-w-4xl gap-6"
            onSubmit={(event) => {
                event.preventDefault();
                form.put(update.url(), { preserveScroll: true });
            }}
        >
            {Object.keys(form.errors).length > 0 && (
                <AlertError
                    title="Settings were not saved."
                    errors={Object.values(form.errors)}
                />
            )}

            <Group title="Processing">
                <Toggle
                    checked={data.processing_enabled}
                    onChange={(value) => setData('processing_enabled', value)}
                    label="Process uploaded images"
                    hint="Compress and build size variants for JPEG, PNG and WebP images. GIFs are never processed, so animation is kept."
                />
                <Toggle
                    checked={data.compress_images}
                    onChange={(value) => setData('compress_images', value)}
                    label="Compress images"
                    hint="Re-encodes in the same format. If the result isn’t smaller, the original is kept. The untouched original is always saved."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="quality">Quality (1–100)</Label>
                        <Input
                            id="quality"
                            type="number"
                            min={1}
                            max={100}
                            value={data.compression_quality}
                            onChange={(event) =>
                                setData(
                                    'compression_quality',
                                    Number(event.target.value),
                                )
                            }
                        />
                        <span className="text-xs text-muted-foreground">
                            Applies to JPEG. PNG compression is lossless.
                        </span>
                    </div>
                    <div className="grid gap-2">
                        <Label>When to process</Label>
                        <Select
                            value={data.processing_method}
                            onValueChange={(value) =>
                                setData(
                                    'processing_method',
                                    value as ProcessingMethod,
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="immediate">
                                    Immediately, during upload
                                </SelectItem>
                                <SelectItem value="queue">
                                    In the background queue
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                            Queue mode needs a worker running (php artisan
                            queue:work), or images stay pending.
                        </span>
                    </div>
                </div>
            </Group>

            <Group title="Sizes">
                <p className="text-sm text-muted-foreground">
                    Variants built from each image. Images are only ever shrunk,
                    never enlarged. Crop fills the exact width × height;
                    otherwise the image fits inside it. Pages use “large” for
                    display, and grids and pickers use “thumbnail”.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                            <tr>
                                <th className="p-1 font-medium">On</th>
                                <th className="p-1 font-medium">Name</th>
                                <th className="p-1 font-medium">Width</th>
                                <th className="p-1 font-medium">Height</th>
                                <th className="p-1 font-medium">Crop</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {data.sizes.map((size, index) => (
                                <tr key={index}>
                                    <td className="p-1">
                                        <Checkbox
                                            checked={size.enabled}
                                            onCheckedChange={(value) =>
                                                setSize(index, {
                                                    enabled: value === true,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className="p-1">
                                        <Input
                                            value={size.name}
                                            onChange={(event) =>
                                                setSize(index, {
                                                    name: event.target.value,
                                                })
                                            }
                                            className="w-36"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={size.width ?? ''}
                                            onChange={(event) =>
                                                setSize(index, {
                                                    width: numberOrNull(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-24"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={size.height ?? ''}
                                            onChange={(event) =>
                                                setSize(index, {
                                                    height: numberOrNull(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-24"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <Checkbox
                                            checked={size.crop}
                                            onCheckedChange={(value) =>
                                                setSize(index, {
                                                    crop: value === true,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className="p-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setData(
                                                    'sizes',
                                                    data.sizes.filter(
                                                        (_, position) =>
                                                            position !== index,
                                                    ),
                                                )
                                            }
                                            title="Remove size"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-self-start"
                    onClick={() =>
                        setData('sizes', [
                            ...data.sizes,
                            {
                                name: '',
                                width: null,
                                height: null,
                                crop: false,
                                enabled: true,
                            },
                        ])
                    }
                >
                    <Plus />
                    Add size
                </Button>
            </Group>

            <Group title="Uploads">
                <div className="grid max-w-xs gap-2">
                    <Label htmlFor="max-size">Max file size (KB)</Label>
                    <Input
                        id="max-size"
                        type="number"
                        min={1}
                        value={data.max_file_size}
                        onChange={(event) =>
                            setData('max_file_size', Number(event.target.value))
                        }
                    />
                    <span className="text-xs text-muted-foreground">
                        PHP’s own limits also apply and win if lower. The
                        running server allows {phpLimits.upload_max_filesize}{' '}
                        per file and {phpLimits.post_max_size} per upload, set
                        in {phpLimits.ini_file}.
                    </span>
                </div>
                <div className="grid gap-2">
                    <Label>Allowed file types</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {supportedMimeTypes.map((mimeType) => (
                            <label
                                key={mimeType}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    checked={data.allowed_mime_types.includes(
                                        mimeType,
                                    )}
                                    onCheckedChange={(value) =>
                                        setData(
                                            'allowed_mime_types',
                                            value === true
                                                ? [
                                                      ...data.allowed_mime_types,
                                                      mimeType,
                                                  ]
                                                : data.allowed_mime_types.filter(
                                                      (type) =>
                                                          type !== mimeType,
                                                  ),
                                        )
                                    }
                                />
                                {mimeType}
                            </label>
                        ))}
                    </div>
                </div>
            </Group>

            <div className="flex justify-end">
                <Button type="submit" disabled={form.processing}>
                    Save settings
                </Button>
            </div>
        </form>
    );
}
