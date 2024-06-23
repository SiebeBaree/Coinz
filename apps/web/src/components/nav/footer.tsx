import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-card flex items-center">
            <div className="container mx-auto px-5 flex flex-col max-w-[800px]">
                <div className="grid gap-8 mt-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                    <div className="flex flex-col gap-3">
                        <p className="font-semibold uppercase text-muted text-lg text-center">LINKS</p>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/invite'}>Invite Coinz</Link>
                            <Link href={'/support'}>Support Server</Link>
                            <Link href={'/status'}>Status</Link>
                            <Link href={'/roadmap'}>Roadmap</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="font-semibold uppercase text-muted text-lg text-center">MANAGE</p>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/premium'}>Premium</Link>
                            <Link href={'/dashboard'}>Dashboard</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="font-semibold uppercase text-muted text-lg text-center">VOTE FOR US</p>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/vote'}>Vote</Link>
                            <Link href={'https://top.gg/bot/938771676433362955'} target="_blank">
                                Top.gg
                            </Link>
                            <Link href={'https://discordbotlist.com/bots/coinz'} target="_blank">
                                Discordbotlist
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="font-semibold uppercase text-muted text-lg text-center">COMPANY</p>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/changelog'}>Changelog</Link>
                            <Link href={'/privacy-policy'}>Privacy Policy</Link>
                            <Link href={'/terms-of-use'}>Terms Of Use</Link>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 items-center mt-6 mb-4 md:my-4">
                    <Image src="/logo.png" alt="Coinz logo" height={64} width={64} />
                    <p
                        className="text-3xl font-bold"
                        style={{
                            fontFamily: 'Ginto Nord, Inter, Poppins, Roboto, sans-serif',
                        }}
                    >
                        Coinz
                    </p>
                </div>

                <div className="text-center font-medium text-sm mb-4">
                    <p className="text-muted">Copyright © {currentYear} Coinz</p>
                </div>
            </div>
        </footer>
    );
}
