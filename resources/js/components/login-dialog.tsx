import { Form, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

export function LoginDialog() {
    const { canResetPassword, canRegister } = usePage().props;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Log in</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Log in</DialogTitle>
                    <DialogDescription>
                        Enter your email and password to log in.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...store.form()}
                    options={{ preserveState: true, preserveScroll: true }}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>

                            {canRegister && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Don't have an account?{' '}
                                    <TextLink href={register()}>
                                        Sign up
                                    </TextLink>
                                </p>
                            )}
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
