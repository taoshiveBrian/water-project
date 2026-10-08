<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $profile_text
 * @property string|null $link_1
 * @property string|null $link_2
 * @property string|null $link_3
 * @property int|null $avatar_id A media library asset in the "avatars" folder.
 * @property-read string|null $avatar The avatar's URL at avatar size.
 * @property-read bool $avatar_pixelated
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'profile_text', 'link_1', 'link_2', 'link_3'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'avatarImage'])]
#[Appends(['avatar', 'avatar_pixelated'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function avatarImage(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'avatar_id');
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->avatarImage?->thumbnail_url);
    }

    /**
     * Whether the avatar is pixel art, to be shown with hard pixel edges.
     *
     * @return Attribute<bool, never>
     */
    protected function avatarPixelated(): Attribute
    {
        return Attribute::get(fn (): bool => $this->avatarImage?->isPixelArt() ?? false);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
