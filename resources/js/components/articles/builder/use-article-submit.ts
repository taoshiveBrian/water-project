import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export type ArticleFormData = Record<string, string | File>;

/**
 * Posts an editor's multipart payload. Updates use method spoofing because PHP
 * only parses multipart bodies on POST. A ref blocks double submits.
 */
export function useArticleSubmit() {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const submitting = useRef(false);

    const submit = (
        url: string,
        method: 'post' | 'put',
        data: ArticleFormData,
    ) => {
        if (submitting.current) {
            return;
        }

        submitting.current = true;
        setProcessing(true);

        router.post(
            url,
            method === 'put' ? { ...data, _method: 'put' } : data,
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (validationErrors) =>
                    setErrors(validationErrors as Record<string, string>),
                onFinish: () => {
                    submitting.current = false;
                    setProcessing(false);
                },
            },
        );
    };

    return { submit, errors, processing };
}
