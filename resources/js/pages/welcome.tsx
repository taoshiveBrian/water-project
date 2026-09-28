import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Droplets } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground lg:p-8">
                <main className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-sky-600 text-white">
                                <Droplets className="size-6" />
                            </div>
                            <h1 className="text-4xl font-semibold tracking-tight">
                                Water Comb
                            </h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit. Integer posuere erat a ante venenatis dapibus
                            posuere velit aliquet.
                        </p>
                        <p className="text-muted-foreground">
                            Maecenas faucibus mollis interdum. Cras mattis
                            consectetur purus sit amet fermentum. Donec sed odio
                            dui, nullam quis risus eget urna mollis ornare vel
                            eu leo.
                        </p>
                    </section>

                    <section className="w-full max-w-sm justify-self-center rounded-xl border bg-card p-8 shadow-sm lg:justify-self-end">
                        {auth.user ? (
                            <div className="flex flex-col gap-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Signed in as {auth.user.name}
                                </p>
                                <Button asChild>
                                    <Link href={dashboard()}>
                                        Go to dashboard
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <h2 className="text-xl font-medium">
                                            Log in
                                        </h2>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoComplete="email"
                                                placeholder="email@example.com"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">
                                                    Password
                                                </Label>
                                                <TextLink
                                                    href={request()}
                                                    className="ml-auto text-sm"
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            </div>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                placeholder="Password"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                            />
                                            <Label htmlFor="remember">
                                                Remember me
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Log in
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}
