import type { CSSProperties } from "react";

type NavbarSvgIconProps = { className?: string; style?: CSSProperties };

/** Almohada — mismo asset que en el mega menú estático (Navbar). */
export function PillowIcon({ className, style }: NavbarSvgIconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <rect width="24" height="24" stroke="none" fill="#000000" opacity="0" />
      <g transform="matrix(0.16 0 0 0.16 12 12)">
        <path
          style={{
            stroke: "none",
            strokeWidth: 1,
            strokeDasharray: "none",
            strokeLinecap: "butt",
            strokeDashoffset: 0,
            strokeLinejoin: "miter",
            strokeMiterlimit: 4,
            fill: "currentColor",
            fillRule: "nonzero",
            opacity: 1,
          }}
          transform=" translate(-64, -63.95)"
          d="M 54 17 C 41.7 17 32.7 18.1 25.5 20.5 C 23.7 21.1 21.900781 21.000781 20.300781 20.300781 C 12.300781 16.500781 6.6003906 16.300391 3.4003906 19.400391 C 0.30039062 22.600391 0.59921875 28.1 4.1992188 36 C 4.8992188 37.5 5.0007813 39.399609 4.3007812 41.099609 C 3.7007812 42.699609 4.5996094 44.400391 6.0996094 44.900391 C 7.6996094 45.500391 9.4003906 44.599609 9.9003906 43.099609 C 11.100391 39.899609 10.899609 36.400391 9.5996094 33.400391 C 6.6996094 27.100391 7.0992187 24.199609 7.6992188 23.599609 C 8.2992187 22.999609 11.200781 22.599219 17.800781 25.699219 C 20.800781 27.099219 24.200391 27.299219 27.400391 26.199219 C 33.900391 23.999219 42.4 23 54 23 L 74 23 C 85.6 23 94.099609 23.999219 100.59961 26.199219 C 103.79961 27.299219 107.29922 27.099219 110.19922 25.699219 C 116.69922 22.599219 119.70078 22.999609 120.30078 23.599609 C 120.90078 24.199609 121.30039 27.000391 118.40039 33.400391 C 117.00039 36.400391 116.89961 39.799609 118.09961 43.099609 C 120.09961 48.599609 121 55.5 121 64 C 121 72.5 119.99961 79.400391 118.09961 84.900391 C 116.89961 88.100391 117.10039 91.599609 118.40039 94.599609 C 121.30039 100.89961 120.90078 103.80039 120.30078 104.40039 C 119.70078 105.00039 116.79922 105.40078 110.19922 102.30078 C 107.19922 100.90078 103.79961 100.70078 100.59961 101.80078 C 96.999609 103.00078 92.800781 103.90039 87.800781 104.40039 L 84.800781 104.69922 C 83.100781 104.79922 81.9 106.30039 82 107.90039 C 82.1 109.50039 83.599219 110.79922 85.199219 110.69922 C 86.299219 110.59922 87.400391 110.50039 88.400391 110.40039 C 93.800391 109.80039 98.4 108.9 102.5 107.5 C 104.3 106.9 106.09922 106.99922 107.69922 107.69922 C 111.99922 109.69922 115.69961 110.69922 118.59961 110.69922 C 121.09961 110.69922 123.1 110 124.5 108.5 C 127.6 105.4 127.40078 99.8 123.80078 92 C 123.10078 90.5 122.99922 88.600391 123.69922 86.900391 C 125.89922 80.700391 127 73.2 127 64 C 127 54.8 125.89922 47.299609 123.69922 41.099609 C 123.09922 39.299609 123.10078 37.5 123.80078 36 C 127.40078 28.2 127.6 22.6 124.5 19.5 C 121.3 16.3 115.59961 16.600391 107.59961 20.400391 C 105.99961 21.100391 104.20039 21.199609 102.40039 20.599609 C 95.300391 18.099609 86.3 17 74 17 L 54 17 z M 23.498047 41.251953 C 22.529297 41.301758 21.599609 41.824219 21.099609 42.699219 C 18.399609 47.199219 17 54.3 17 64 C 17 65.7 18.3 67 20 67 C 21.7 67 23 65.7 23 64 C 23 53.4 24.799219 48.200781 26.199219 45.800781 C 27.099219 44.400781 26.599219 42.499219 25.199219 41.699219 C 24.674219 41.361719 24.079297 41.22207 23.498047 41.251953 z M 4 61 C 2.3 61 1 62.3 1 64 C 1 73.2 2.1007813 80.700391 4.3007812 86.900391 C 4.9007812 88.700391 4.8992187 90.5 4.1992188 92 C 0.59921875 99.8 0.4 105.4 3.5 108.5 C 6.7 111.7 12.400391 111.39961 20.400391 107.59961 C 22.000391 106.89961 23.799609 106.80039 25.599609 107.40039 C 32.799609 109.80039 41.799609 110.90039 54.099609 110.90039 L 65.400391 110.90039 C 67.100391 110.90039 68.400391 109.60039 68.400391 107.90039 C 68.400391 106.20039 67.100391 104.90039 65.400391 104.90039 L 54 104.90039 C 42.4 104.90039 33.900391 103.89922 27.400391 101.69922 C 24.200391 100.59922 20.700781 100.79922 17.800781 102.19922 C 11.300781 105.29922 8.2992188 104.90078 7.6992188 104.30078 C 7.0992188 103.70078 6.6996094 100.9 9.5996094 94.5 C 10.999609 91.6 11.100391 88.100391 9.9003906 84.900391 C 8.0003906 79.400391 7 72.5 7 64 C 7 62.3 5.7 61 4 61 z"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/** Sábanas / textil de cama — mismo asset que en el mega menú estático (Navbar). */
export function SheetsIcon({ className, style }: NavbarSvgIconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <rect width="24" height="24" stroke="none" fill="#000000" opacity="0" />
      <g transform="matrix(0.42 0 0 0.42 12 12)">
        <g>
          <g transform="matrix(1 0 0 1 -13.63 12.8)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-10.37, -36.8)"
              d="M 13.25 39.86 L 10.5 39.86 C 8.48 39.86 7.04 37.91 7.63 35.98 L 8.32 33.739999999999995"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 6.77 9.86)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-30.77, -33.86)"
              d="M 40.72 27.85 C 41.39 28.6 41.69 29.67 41.36 30.75 L 39.42 37.04 C 38.9 38.72 37.35 39.86 35.6 39.86 L 20.05 39.86"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 0.5 3.84)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-24.5, -27.84)"
              d="M 40.91 21.96 C 41.449999999999996 22.69 41.66 23.66 41.36 24.62 L 39.42 30.91 C 38.9 32.59 37.35 33.73 35.6 33.73 L 10.5 33.73 C 8.48 33.73 7.04 31.779999999999998 7.63 29.849999999999998 L 8.54 26.889999999999997"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 -6.51 0.56)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-17.49, -24.56)"
              d="M 27.48 27.62 L 10.5 27.62 C 8.48 27.62 7.04 25.67 7.63 23.740000000000002 L 8.32 21.5"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 13.5 -2.36)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-37.5, -21.64)"
              d="M 40.76 15.65 C 41.41 16.4 41.69 17.45 41.37 18.51 L 39.43 24.8 C 38.91 26.48 37.36 27.62 35.61 27.62 L 33.5 27.62"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 -5.33 -8.99)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-18.67, -15.01)"
              d="M 13.25 21.5 L 10.5 21.5 C 8.48 21.5 7.04 19.55 7.63 17.62 L 9.57 11.330000000000002 C 10.09 9.650000000000002 11.64 8.510000000000002 13.39 8.510000000000002 L 29.84 8.510000000000002"
              strokeLinecap="round"
            />
          </g>
          <g transform="matrix(1 0 0 1 5.75 -9.01)" id="Layer_1">
            <path
              style={{
                stroke: "currentColor",
                strokeWidth: 3,
                strokeDasharray: "none",
                strokeLinecap: "round",
                strokeDashoffset: 0,
                strokeLinejoin: "round",
                strokeMiterlimit: 10,
                fill: "none",
                fillRule: "nonzero",
                opacity: 1,
              }}
              transform=" translate(-29.75, -14.99)"
              d="M 37.68 8.5 L 38.5 8.5 C 40.52 8.5 41.96 10.45 41.37 12.379999999999999 L 39.43 18.669999999999998 C 38.91 20.349999999999998 37.36 21.49 35.61 21.49 L 17.99 21.49"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
