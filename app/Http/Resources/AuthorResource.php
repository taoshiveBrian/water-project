<?php

namespace App\Http\Resources;

use App\Enums\ProfileVisibility;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An article's author for bylines. Expects `avatarImage` loaded.
 *
 * @mixin User
 */
class AuthorResource extends JsonResource
{
    private bool $withProfile = false;

    /**
     * Also include the profile card, when this viewer may see it.
     */
    public static function withProfile(User $user): self
    {
        $resource = new self($user);
        $resource->withProfile = true;

        return $resource;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'avatar_pixelated' => $this->avatar_pixelated,
            ...($this->withProfile ? ['profile' => $this->profile($request)] : []),
        ];
    }

    /**
     * Null unless the author lets this viewer see it: everyone, or members only.
     * The email is left out unless they chose to show it.
     *
     * @return array{profile_text: string|null, links: list<string>, email: string|null}|null
     */
    private function profile(Request $request): ?array
    {
        if ($this->profile_visibility !== ProfileVisibility::Public && ! $request->user()) {
            return null;
        }

        return [
            'profile_text' => $this->profile_text,
            'links' => array_values(array_filter([$this->link_1, $this->link_2, $this->link_3])),
            'email' => $this->show_email ? $this->email : null,
        ];
    }
}
