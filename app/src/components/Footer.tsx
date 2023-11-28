import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-secondary h-[100px] flex items-center">
            <div className="container mx-auto px-5 flex justify-between items-center">
                <div className="flex gap-6 items-center">
                    <Image src="/logo192.png" alt="Coinz logo" height={64} width={64} />

                    <div>
                        <h1
                            className="text-3xl font-bold"
                            style={{
                                fontFamily: 'Ginto Nord, Inter, Poppins, Roboto, sans-serif',
                            }}
                        >
                            Coinz
                        </h1>
                        <p className="text-muted">Copyright © {currentYear} Coinz</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <Link href={'/commands'}>Commands</Link>
                    <Link href={'/premium'}>Premium</Link>
                    <Link href={'/support'}>Support Server</Link>
                    <Link href={'/terms-of-use'}>Terms Of Use</Link>
                    <Link href={'/privacy-policy'}>Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}
