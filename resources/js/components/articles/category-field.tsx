import { useState } from 'react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types';

const NONE = 'none';
const NEW = 'new';

/**
 * An optional category: an existing one, or the name of a new one the server creates.
 */
export function useCategoryChoice(initial: Category | null) {
    const [selected, setSelected] = useState(
        initial ? String(initial.id) : NONE,
    );
    const [newName, setNewName] = useState('');

    return { selected, setSelected, newName, setNewName };
}

export type CategoryChoice = ReturnType<typeof useCategoryChoice>;

export function categoryFormData(choice: CategoryChoice): {
    category_id: string;
    new_category: string;
} {
    return {
        category_id:
            choice.selected === NONE || choice.selected === NEW
                ? ''
                : choice.selected,
        new_category: choice.selected === NEW ? choice.newName : '',
    };
}

export function CategoryField({
    choice,
    categories,
    errors,
}: {
    choice: CategoryChoice;
    categories: Category[];
    errors: Record<string, string>;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor="article-category">Category</Label>
            <div className="flex flex-wrap gap-2">
                <Select
                    value={choice.selected}
                    onValueChange={choice.setSelected}
                >
                    <SelectTrigger id="article-category" className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE}>No category</SelectItem>
                        {categories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value={NEW}>New category…</SelectItem>
                    </SelectContent>
                </Select>
                {choice.selected === NEW && (
                    <Input
                        value={choice.newName}
                        onChange={(event) =>
                            choice.setNewName(event.target.value)
                        }
                        placeholder="Category name"
                        aria-label="New category name"
                        className="w-56"
                        maxLength={50}
                        autoFocus
                    />
                )}
            </div>
            <InputError message={errors.category_id ?? errors.new_category} />
        </div>
    );
}
