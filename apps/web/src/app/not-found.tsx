import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-7xl sm:text-[200px] font-bold">Oops!</h1>
            <h2 className="text-xl sm:text-3xl font-semibold uppercase mt-2">404 - Page not found</h2>
            <p className="max-w-[500px] text-center text-sm px-5">
                The page you are looking for might have been removed. had its name changed or is temporarily
                unavailable.
            </p>
            <Link href="/">
                <Button>Go to homepage</Button>
            </Link>
        </div>
    );
}
