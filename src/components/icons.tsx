import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3-1-3l-6-6-6 6s-1 1-1 3a7 7 0 0 0 7 7Z" />
      <path d="M12 6V2" />
      <path d="M5 5L2 2" />
      <path d="m19 5 3-3" />
    </svg>
  ),
};
