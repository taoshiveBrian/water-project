<?php

namespace App\Enums;

/**
 * Who can open a user's profile card from their articles.
 */
enum ProfileVisibility: string
{
    /** Signed-in members only. */
    case Members = 'members';

    /** Anyone, including guests. */
    case Public = 'public';
}
