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

export type Product = {
    name: string;
    logo: string;
    price: {
        monthly: number;
        quarterly: number;
    };
    features: string[];
    planId: number;
    variantId: number;
    premium: number;
};
