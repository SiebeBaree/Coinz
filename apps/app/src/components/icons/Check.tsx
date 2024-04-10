import { IconProps } from '@/lib/interfaces';

export default function CheckIcon(props: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className={props.className}
            style={props.style}
        >
            <path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z" fill={props.fill} />
        </svg>
    );
}
