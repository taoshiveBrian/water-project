export type ProcessingStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';

export type ProcessingMethod = 'immediate' | 'queue';

export type MediaFileType = 'image' | 'video' | 'audio' | 'document';

export type MediaAsset = {
    id: number;
    title: string | null;
    original_filename: string;
    alt_text: string | null;
    description: string | null;
    url: string;
    thumbnail_url: string;
    size_urls: Record<string, string>;
    mime_type: string | null;
    category: MediaFileType | null;
    subcategory: string | null;
    file_size: number | null;
    optimized_size: number | null;
    processing_status: ProcessingStatus;
    processing_error: string | null;
    is_featured: boolean;
    is_library_item: boolean;
    is_private: boolean;
    is_pixel_art: boolean;
    uploaded_by: string | null;
    created_at: string;
    /** Articles that use this file. Only present in the gallery. */
    usage?: { id: number; title: string }[];
};

export type MediaSize = {
    name: string;
    width: number | null;
    height: number | null;
    crop: boolean;
    enabled: boolean;
};

export type MediaSettings = {
    processing_enabled: boolean;
    compress_images: boolean;
    compression_quality: number;
    sizes: MediaSize[];
    processing_method: ProcessingMethod;
    allowed_mime_types: string[];
    max_file_size: number;
    /** Kilobytes. Images this size or smaller render as pixel art; 0 turns it off. */
    pixel_art_max_size: number;
};

export type MediaFilters = {
    search: string | null;
    type: MediaFileType | null;
    folder: string | null;
    featured: boolean;
};

export type MediaStats = {
    total_count: number;
    total_size: number;
    saved_bytes: number;
    by_type: Partial<Record<MediaFileType, number>>;
};

export type QueueStats = Record<ProcessingStatus, number>;

/**
 * An image chosen in the library picker.
 */
export type PickedImage = {
    id: number;
    url: string;
    title: string | null;
    original_filename: string;
    thumbnail_url: string;
    alt_text: string | null;
    is_pixel_art?: boolean;
};

/**
 * Upload limits of the PHP process serving the app.
 */
export type PhpLimits = {
    upload_max_filesize: string;
    post_max_size: string;
    ini_file: string;
};
