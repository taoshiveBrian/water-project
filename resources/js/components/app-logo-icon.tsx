import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    alt = 'WaterComb',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/brand/watercomb-192.png"
            alt={alt}
            {...props}
        />
    );
}
