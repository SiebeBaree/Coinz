export default function PageTitle({ watermark, title, description }: {
    watermark?: string,
    title: string,
    description: string
}) {
    return (
        <div className="relative py-8 sm:pt-16">
            <div>
                <h1 className="text-3xl sm:text-4xl font-semibold">{title}</h1>
                <h2 className="font-bold absolute hidden sm:block text-8xl 2xl:text-9xl watermark">{watermark ?? title}</h2>
            </div>
            <p className="w-full md:w-1/2">{description}</p>
        </div>
    );
}