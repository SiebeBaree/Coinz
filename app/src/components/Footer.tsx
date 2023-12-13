import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-secondary flex items-center">
            <div className="container mx-auto px-5 flex flex-col max-w-[800px]">
                <div
                    className="grid sm:flex justify-between gap-8 mt-6"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <h1 className="font-semibold uppercase text-muted text-lg text-center">LINKS</h1>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/invite'}>Invite Coinz</Link>
                            <Link href={'/support'}>Support Server</Link>
                            <Link href={'/status'}>Status</Link>
                            <Link href={'/changelog'}>Changelog</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h1 className="font-semibold uppercase text-muted text-lg text-center">MANAGE</h1>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/premium'}>Premium</Link>
                            <Link href={'/profile'}>Profile</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h1 className="font-semibold uppercase text-muted text-lg text-center">VOTE FOR US</h1>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'https://top.gg/bot/938771676433362955'} target="_blank">
                                Top.gg
                            </Link>
                            <Link href={'https://discordbotlist.com/bots/coinz'} target="_blank">
                                Discordbotlist
                            </Link>
                            <Link href={'https://discords.com/bots/bot/938771676433362955'} target="_blank">
                                Discords
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h1 className="font-semibold uppercase text-muted text-lg text-center">COMPANY</h1>

                        <div className="flex flex-col gap-1 text-center">
                            <Link href={'/careers'}>Careers</Link>
                            <Link href={'/privacy-policy'}>Privacy Policy</Link>
                            <Link href={'/terms-of-use'}>Terms Of Use</Link>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 items-center mt-6 mb-4 md:my-4">
                    <Image src="/logo192.png" alt="Coinz logo" height={64} width={64} />
                    <h3
                        className="text-3xl font-bold"
                        style={{
                            fontFamily: 'Ginto Nord, Inter, Poppins, Roboto, sans-serif',
                        }}
                    >
                        Coinz
                    </h3>
                </div>

                <div className="text-center font-medium text-sm mb-4">
                    <p className="text-muted">Copyright © {currentYear} Coinz</p>
                </div>
            </div>
        </footer>
    );
}
