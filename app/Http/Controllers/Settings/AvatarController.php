<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AvatarUpdateRequest;
use App\Models\Asset;
use App\Models\User;
use App\Services\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * The signed-in user's single avatar slot: either a shared avatar from the media
 * library's "Avatars" folder, or a private upload of their own in "user_avatars".
 * Changing it deletes the previous private upload.
 */
class AvatarController extends Controller
{
    /**
     * Upload a private avatar, replacing the current one.
     */
    public function update(AvatarUpdateRequest $request, AssetService $assets): RedirectResponse
    {
        $avatar = $assets->store($request->file('avatar'), Asset::USER_AVATAR_FOLDER, $request->user(), isLibraryItem: true, isPrivate: true);

        return $this->replaceAvatar($request->user(), $avatar, __('Avatar updated.'));
    }

    /**
     * Pick one of the shared avatars.
     */
    public function choose(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'integer', Rule::exists('assets', 'id')
                ->where('category', 'image')
                ->where('subcategory', Asset::AVATAR_FOLDER)
                ->where('is_private', false)],
        ]);

        return $this->replaceAvatar($request->user(), Asset::findOrFail($validated['asset_id']), __('Avatar updated.'));
    }

    /**
     * Remove the avatar.
     */
    public function destroy(Request $request): RedirectResponse
    {
        return $this->replaceAvatar($request->user(), null, __('Avatar removed.'));
    }

    private function replaceAvatar(User $user, ?Asset $avatar, string $message): RedirectResponse
    {
        $previous = $user->avatarImage;

        $user->avatarImage()->associate($avatar);
        $user->save();

        if ($previous && $previous->isNot($avatar) && $previous->is_private && $previous->user_id === $user->id) {
            $previous->delete();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('profile.edit');
    }
}
