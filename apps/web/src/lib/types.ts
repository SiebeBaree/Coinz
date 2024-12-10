export type IconProps = {
    fill?: string;
    className?: string;
    style?: React.CSSProperties;
};

export type Changelog = {
    version: string;
    name: string;
    timestamp: number;
    content: string[];
};
