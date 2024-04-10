import { IconProps } from '@/lib/interfaces';

export default function MinusIcon(props: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className={props.className}
            style={props.style}
        >
            <path d="M5 11h14v2H5z" fill={props.fill} />
        </svg>
    );
}
