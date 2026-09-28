import { ImagePicker } from '@/components/articles/builder/image-picker';
import { useSectionsScope } from '@/components/articles/builder/sections-scope';

/**
 * A full-width image at this point in the article. The slot it owns is created
 * together with the section, so there's no mount effect to double-fire.
 */
export function HeroImage({ instanceId }: { instanceId: string }) {
    const { pool, setPoolFile, setPoolAsset } = useSectionsScope();
    const slot = pool.find((image) => image.heroFor === instanceId);

    if (!slot) {
        return null;
    }

    return (
        <ImagePicker
            preview={slot.preview}
            onSelect={(file) => setPoolFile(slot.tag, file)}
            onPickAsset={(image) => setPoolAsset(slot.tag, image)}
            label="Choose a hero image"
            className="aspect-video w-full"
        />
    );
}
