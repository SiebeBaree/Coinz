import { cn } from '@/lib/utils';

type SectionWrapperProps = {
    className?: string;
    children: React.ReactNode;
};

export default function SectionWrapper({ className, children }: SectionWrapperProps) {
    return <div className={cn('container', className)}>{children}</div>;
}
