<template>
  <!--
    Wireframe geometric pill capsule.
    Geometry (pre-rotation): capsule rect x=3 y=10 w=26 h=12 rx=6
    Key boundary points: (3,16) (9,10) (16,10) (23,10) (29,16) (23,22) (16,22) (9,22)
    Inner diamond: (3,16)→(16,10)→(29,16)→(16,22)→(3,16)
    Cross facets:  (9,10)→(23,22)  and  (23,10)→(9,22)
    All rotated -35° around center (16,16)
  -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <defs>
      <!-- Gradient in global space so it flows consistently across all strokes -->
      <linearGradient id="wtp-g" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stop-color="#22D3EE"/>
        <stop offset="48%"  stop-color="#818CF8"/>
        <stop offset="100%" stop-color="#C026D3"/>
      </linearGradient>
    </defs>
    <g transform="rotate(-35, 16, 16)" stroke="url(#wtp-g)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Capsule silhouette -->
      <path d="M 9 10 H 23 A 6 6 0 1 1 23 22 H 9 A 6 6 0 1 1 9 10 Z" stroke-width="1.25"/>
      <!-- Inner diamond: connects the 4 axis-extreme points through the interior -->
      <path d="M 3 16 L 16 10 L 29 16 L 16 22 Z" stroke-width="0.75"/>
      <!-- Cross diagonals: cap-corner to cap-corner, forming triangular facets -->
      <line x1="9"  y1="10" x2="23" y2="22" stroke-width="0.75"/>
      <line x1="23" y1="10" x2="9"  y2="22" stroke-width="0.75"/>
    </g>
  </svg>
</template>
