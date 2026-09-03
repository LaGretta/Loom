/*!
 * Loom Gifts — drop-in animated collectible library (v1)
 * Zero network. Pure inline SVG + SMIL. No dependencies, no external fonts.
 *
 * USAGE ------------------------------------------------------------------
 *   <script src="loom-gifts.js"></script>
 *
 *   // A) Declarative: any element with data-loom-gift is hydrated on load.
 *   <span data-loom-gift="g-fox" data-size="140"></span>          // bare object
 *   <div  data-loom-card="Crystal Fox"></div>                      // full collectible card
 *
 *   // B) Programmatic:
 *   document.body.appendChild(LoomGifts.el('g-nebula', 160));      // -> <svg> element
 *   container.innerHTML = LoomGifts.cardHTML('Nebula Orb');        // -> card markup string
 *   LoomGifts.CATALOG;                                             // the 12 gifts' metadata
 *
 * Gift symbol ids: g-spool g-nebula g-feather g-crane g-heart g-jelly
 *                  g-fox g-comet g-egg g-balloon g-cassette g-pearl
 *
 * Rarity presentation (radial backdrop + drifting symbol pattern + rarity chip +
 * edition #) is built into cardHTML(). Motion scales with rarity, exactly as authored.
 * Respects prefers-reduced-motion: freezes every loop on a clean glossy frame.
 * ------------------------------------------------------------------------ */
(function (root) {
  var FONT = "'Inter var', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

  var DEFS = `<svg id="loom-gifts-defs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>

    <pattern id="giftPat" width="54" height="54" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
      <circle cx="13" cy="13" r="4" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.2"/>
      <circle cx="13" cy="13" r="8" fill="none" stroke="#fff" stroke-opacity="0.11" stroke-width="1.1"/>
      <path d="M40 8l1.3 3.4 3.4 1.3-3.4 1.3L40 17l-1.3-3.4L35.3 12.7 38.7 11.4z" fill="#fff" fill-opacity="0.14"/>
      <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="54 54" dur="26s" repeatCount="indefinite" additive="sum"/>
    </pattern>

    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="soft2" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="glow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="rainbowG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF4D6D"/><stop offset="0.17" stop-color="#FF9A3D"/><stop offset="0.34" stop-color="#FFE24D"/><stop offset="0.5" stop-color="#6BE07A"/><stop offset="0.67" stop-color="#4DC8FF"/><stop offset="0.84" stop-color="#6B7BFF"/><stop offset="1" stop-color="#C86DFF"/></linearGradient>
    <radialGradient id="spec" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.98"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vigDark" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#0A0A16" stop-opacity="0"/><stop offset="0.58" stop-color="#0A0A16" stop-opacity="0"/><stop offset="0.84" stop-color="#0A0A16" stop-opacity="0.28"/><stop offset="1" stop-color="#060610" stop-opacity="0.62"/></radialGradient>

    <radialGradient id="nbSpace" cx="0.40" cy="0.34" r="0.66"><stop offset="0" stop-color="#5257B0"/><stop offset="0.34" stop-color="#2E3184"/><stop offset="0.62" stop-color="#1A1C54"/><stop offset="0.85" stop-color="#0C0D30"/><stop offset="1" stop-color="#050618"/></radialGradient>
    <radialGradient id="nbVig" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#050618" stop-opacity="0"/><stop offset="0.62" stop-color="#050618" stop-opacity="0"/><stop offset="0.83" stop-color="#050618" stop-opacity="0.32"/><stop offset="0.96" stop-color="#03040F" stop-opacity="0.72"/><stop offset="1" stop-color="#03040F" stop-opacity="0.9"/></radialGradient>
    <radialGradient id="nbLit" cx="0.36" cy="0.3" r="0.5"><stop offset="0" stop-color="#CBD2FF" stop-opacity="0.42"/><stop offset="0.45" stop-color="#8FA0FF" stop-opacity="0.12"/><stop offset="0.75" stop-color="#8FA0FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="nbDisk" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.15" stop-color="#FFE4FB"/><stop offset="0.34" stop-color="#EBA6F2"/><stop offset="0.55" stop-color="#8E7BF0"/><stop offset="0.78" stop-color="#4548B4" stop-opacity="0.7"/><stop offset="1" stop-color="#2A2A6E" stop-opacity="0"/></radialGradient>
    <radialGradient id="nbCore" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.3" stop-color="#FFEAFC"/><stop offset="0.62" stop-color="#E7B0FF" stop-opacity="0.75"/><stop offset="1" stop-color="#E0A8FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="nbAura" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#8A7BFF" stop-opacity="0.6"/><stop offset="0.55" stop-color="#5B5AC8" stop-opacity="0.22"/><stop offset="1" stop-color="#5B5AC8" stop-opacity="0"/></radialGradient>
    <linearGradient id="nbFres" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#E6ECFF" stop-opacity="0"/><stop offset="0.6" stop-color="#BFA6FF" stop-opacity="0.2"/><stop offset="1" stop-color="#EAF0FF" stop-opacity="0.9"/></linearGradient>

    <linearGradient id="spoolBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A4BD0"/><stop offset="0.32" stop-color="#8E7EF8"/><stop offset="0.5" stop-color="#7C6BF2"/><stop offset="0.78" stop-color="#4A3BC0"/><stop offset="1" stop-color="#332690"/></linearGradient>
    <radialGradient id="spoolFl" cx="0.4" cy="0.32" r="0.8"><stop offset="0" stop-color="#F8F4FF"/><stop offset="0.6" stop-color="#D8CEFB"/><stop offset="1" stop-color="#AEA0E8"/></radialGradient>

    <linearGradient id="featherG" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset="0.3" stop-color="#F7B24E"/><stop offset="0.62" stop-color="#EC5A46"/><stop offset="1" stop-color="#A82820"/></linearGradient>

    <linearGradient id="foilLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C2F8EE"/><stop offset="1" stop-color="#7FE4D6"/></linearGradient>
    <linearGradient id="foilMid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FE0D0"/><stop offset="0.6" stop-color="#B49AE8"/><stop offset="1" stop-color="#E86FC4"/></linearGradient>
    <linearGradient id="foilDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3FA99B"/><stop offset="1" stop-color="#A8478A"/></linearGradient>

    <radialGradient id="brassG" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="#FDEBBA"/><stop offset="0.45" stop-color="#E0AC54"/><stop offset="0.78" stop-color="#B27D2A"/><stop offset="1" stop-color="#7E5414"/></radialGradient>
    <radialGradient id="gearG" cx="0.5" cy="0.4" r="0.55"><stop offset="0" stop-color="#F2D18C"/><stop offset="1" stop-color="#A9741F"/></radialGradient>

    <radialGradient id="jellyBell" cx="0.5" cy="0.3" r="0.72"><stop offset="0" stop-color="#F4FFFB" stop-opacity="0.98"/><stop offset="0.42" stop-color="#88EED6" stop-opacity="0.92"/><stop offset="0.78" stop-color="#3FBFAE" stop-opacity="0.62"/><stop offset="1" stop-color="#2A9A90" stop-opacity="0.35"/></radialGradient>
    <linearGradient id="auroraFlow" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#6BE0FF" stop-opacity="0.6"/><stop offset="0.5" stop-color="#7CF0A8" stop-opacity="0.55"/><stop offset="1" stop-color="#B0A0FF" stop-opacity="0.6"/></linearGradient>

    <linearGradient id="foxLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE0F6"/><stop offset="1" stop-color="#F49ADA"/></linearGradient>
    <linearGradient id="foxMid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EC7ACC"/><stop offset="1" stop-color="#CE58A6"/></linearGradient>
    <linearGradient id="foxDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C24E90"/><stop offset="1" stop-color="#8E2E68"/></linearGradient>
    <radialGradient id="foxInner" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE9FA" stop-opacity="0.9"/><stop offset="0.6" stop-color="#FF9AE0" stop-opacity="0.35"/><stop offset="1" stop-color="#FF9AE0" stop-opacity="0"/></radialGradient>

    <linearGradient id="comLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFEF8"/><stop offset="1" stop-color="#FFEEBC"/></linearGradient>
    <linearGradient id="comMid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCDD92"/><stop offset="1" stop-color="#E7B858"/></linearGradient>
    <linearGradient id="comDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9A544"/><stop offset="1" stop-color="#A87A24"/></linearGradient>

    <radialGradient id="eggG" cx="0.4" cy="0.28" r="0.88"><stop offset="0" stop-color="#E2FBEC"/><stop offset="0.4" stop-color="#56C896"/><stop offset="0.72" stop-color="#2E9A66"/><stop offset="1" stop-color="#0E5030"/></radialGradient>
    <radialGradient id="eggInner" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="#BFFFD8"/><stop offset="1" stop-color="#3BE58A" stop-opacity="0"/></radialGradient>

    <radialGradient id="balloonG" cx="0.4" cy="0.26" r="0.9"><stop offset="0" stop-color="#FFE9CA"/><stop offset="0.45" stop-color="#F7A878"/><stop offset="1" stop-color="#CE4E34"/></radialGradient>
    <linearGradient id="basketG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFA05E"/><stop offset="1" stop-color="#7A5420"/></linearGradient>

    <linearGradient id="cassG" x1="0.1" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#B6EEDA"/><stop offset="0.5" stop-color="#5FBDA0"/><stop offset="1" stop-color="#368A72"/></linearGradient>

    <radialGradient id="pearlG" cx="0.35" cy="0.26" r="0.9"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="#F0F6FF"/><stop offset="0.72" stop-color="#C8DAF2"/><stop offset="1" stop-color="#8CB2E0"/></radialGradient>
    <linearGradient id="shellLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0EFF8"/><stop offset="1" stop-color="#88B4D6"/></linearGradient>
    <linearGradient id="shellDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#AECAE0"/><stop offset="1" stop-color="#5A82A2"/></linearGradient>

    <clipPath id="clipNb"><circle cx="100" cy="96" r="72"/></clipPath>
    <clipPath id="clipBody"><path d="M54 66 Q100 78 146 66 L146 138 Q100 150 54 138 Z"/></clipPath>
    <clipPath id="clipFeather"><path d="M66 168 C 48 116, 66 56, 132 22 C 156 66, 148 130, 96 164 C 86 170, 74 172, 66 168 Z"/></clipPath>
    <clipPath id="clipCrane"><path d="M40 120 L96 78 L150 40 L128 86 L150 96 L104 110 L96 150 L80 112 Z"/></clipPath>
    <clipPath id="clipHeart"><path d="M100 152 C 38 108, 42 56, 78 56 C 92 56, 100 68, 100 78 C 100 68, 108 56, 122 56 C 158 56, 162 108, 100 152 Z"/></clipPath>
    <clipPath id="clipBell"><path d="M46 98 C 46 50, 154 50, 154 98 C 154 106, 148 112, 138 110 C 128 108, 122 112, 116 112 C 108 112, 104 108, 100 108 C 96 108, 92 112, 84 112 C 78 112, 72 108, 62 110 C 52 112, 46 106, 46 98 Z"/></clipPath>
    <clipPath id="clipFox"><path d="M100 40 L128 70 L138 132 L100 150 L62 132 L72 70 Z"/></clipPath>
    <clipPath id="clipComet"><polygon points="100,26 132,74 116,150 84,150 68,74"/></clipPath>
    <clipPath id="clipPearl"><circle cx="100" cy="104" r="30"/></clipPath>
    <clipPath id="clipCass"><rect x="34" y="54" width="132" height="94" rx="14"/></clipPath>

    <!-- ===== 1 THREAD SPOOL (Epic) — spins; thread unwinds, weaves an L, rewinds ===== -->
    <symbol id="g-spool" viewBox="0 0 200 200">
      <ellipse cx="100" cy="176" rx="46" ry="8" fill="#241653" opacity="0.26" filter="url(#soft2)"><animate attributeName="rx" values="46;40;46" dur="5s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="100" r="82" fill="#8A6BF2" opacity="0.16" filter="url(#soft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 5;0 -6;0 5" keyTimes="0;0.5;1" dur="5.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="100" r="74" fill="none" stroke="#C4B0FF" stroke-width="2.5"><animate attributeName="r" values="72;90;90" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0;0" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/></circle>
        <ellipse cx="100" cy="142" rx="48" ry="14" fill="url(#spoolFl)"/>
        <ellipse cx="100" cy="140" rx="44" ry="11" fill="#4A3BC0" opacity="0.45"/>
        <path d="M54 66 Q100 78 146 66 L146 138 Q100 150 54 138 Z" fill="url(#spoolBody)"/>
        <g clip-path="url(#clipBody)">
          <path d="M56 76 Q100 87 144 76 M56 90 Q100 101 144 90 M56 104 Q100 115 144 104 M56 118 Q100 129 144 118 M56 132 Q100 143 144 132" stroke="#38299E" stroke-opacity="0.55" stroke-width="3.4" fill="none"/>
          <path d="M60 82 Q100 92 140 82 M60 110 Q100 120 140 110 M60 126 Q100 136 140 126" stroke="#CBBEFF" stroke-width="2.2" fill="none" opacity="0.7"/>
          <rect x="-30" y="60" width="30" height="92" fill="#fff" opacity="0.3"><animate attributeName="x" values="-40;180" dur="2.4s" repeatCount="indefinite"/></rect>
        </g>
        <ellipse cx="100" cy="64" rx="48" ry="14" fill="url(#spoolFl)"/>
        <ellipse cx="100" cy="62" rx="42" ry="11" fill="#EEE8FF"/>
        <ellipse cx="100" cy="60" rx="12" ry="3.5" fill="#B7ACEB"/>
        <g transform="translate(100 62)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.6s" repeatCount="indefinite" additive="sum"/><ellipse cx="0" cy="-4" rx="16" ry="4" fill="#fff" opacity="0.6"/><ellipse cx="0" cy="4" rx="10" ry="2.6" fill="#8E7EE8" opacity="0.5"/></g>
        <!-- unwinding thread that weaves an L then rewinds -->
        <path fill="none" stroke="#C4A6FF" stroke-width="4.5" stroke-linecap="round" filter="url(#glow)">
          <animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="spline"
            keyTimes="0;0.28;0.5;0.72;1"
            keySplines="0.4 0 0.4 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
            values="M146 96 C 176 92, 184 72, 170 62 C 160 56, 150 66, 160 74;
                    M146 96 C 182 90, 196 60, 178 46 C 166 38, 150 52, 168 64;
                    M146 96 C 168 96, 182 96, 182 74 C 182 56, 182 56, 206 56;
                    M146 96 C 182 90, 196 60, 178 46 C 166 38, 150 52, 168 64;
                    M146 96 C 176 92, 184 72, 170 62 C 160 56, 150 66, 160 74"/>
          <animate attributeName="stroke-dasharray" values="0 8;0 8" dur="6s" repeatCount="indefinite"/>
        </path>
        <circle r="5" fill="#EAD9FF" filter="url(#glow)">
          <animate attributeName="cx" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.28;0.5;0.72;1" keySplines="0.4 0 0.4 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" values="160;168;206;168;160"/>
          <animate attributeName="cy" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.28;0.5;0.72;1" keySplines="0.4 0 0.4 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" values="74;64;56;64;74"/>
        </circle>
      </g>
      <g fill="#C4B0FF"><circle cx="152" cy="70" r="2"><animate attributeName="cy" values="82;40" dur="3.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="3.6s" repeatCount="indefinite"/></circle><circle cx="52" cy="80" r="1.6"><animate attributeName="cy" values="92;50" dur="4.6s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="4.6s" begin="1.4s" repeatCount="indefinite"/></circle></g>
    </symbol>

    <!-- ===== 2 NEBULA ORB (Legendary) — swirl, breathe, twinkle, shooting star, float ===== -->
    <symbol id="g-nebula" viewBox="0 0 200 200">
      <ellipse cx="100" cy="182" rx="50" ry="9" fill="#07081E" opacity="0.28" filter="url(#soft2)"><animate attributeName="rx" values="50;40;50" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0.16;0.3" dur="5s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="96" r="96" fill="url(#nbAura)"><animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 7;0 -9;0 7" keyTimes="0;0.5;1" dur="5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="96" r="74" fill="none" stroke="#B7A6FF" stroke-width="2.5"><animate attributeName="r" values="73;92;92" keyTimes="0;0.7;1" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0;0" keyTimes="0;0.7;1" dur="3.2s" repeatCount="indefinite"/></circle>
        <circle cx="100" cy="96" r="72" fill="url(#nbSpace)"/>
        <g clip-path="url(#clipNb)">
          <g transform="translate(100 96)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="16s" repeatCount="indefinite" additive="sum"/>
            <g transform="rotate(-26)"><ellipse cx="0" cy="0" rx="70" ry="30" fill="url(#nbDisk)" filter="url(#soft)"/><path d="M-56 0 C -40 -30, 34 -26, 54 -2 C 34 -16, -22 -14, -40 6" fill="none" stroke="#FFDCF7" stroke-opacity="0.65" stroke-width="5" stroke-linecap="round" filter="url(#soft)"/><path d="M56 0 C 40 30, -34 26, -54 2 C -34 16, 22 14, 40 -6" fill="none" stroke="#BFC8FF" stroke-opacity="0.55" stroke-width="4.5" stroke-linecap="round" filter="url(#soft)"/></g>
          </g>
          <g transform="translate(100 96)" fill="#fff"><animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="40s" repeatCount="indefinite" additive="sum"/>
            <circle cx="-34" cy="-34" r="1.6"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="32" cy="-26" r="1.3"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.1s" begin="0.6s" repeatCount="indefinite"/></circle><circle cx="40" cy="16" r="1.7"><animate attributeName="opacity" values="0.15;1;0.15" dur="2.7s" begin="1.2s" repeatCount="indefinite"/></circle><circle cx="-28" cy="28" r="1.4"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.4s" begin="0.3s" repeatCount="indefinite"/></circle><circle cx="-46" cy="2" r="1.3"><animate attributeName="opacity" values="0.15;1;0.15" dur="3.6s" begin="0.9s" repeatCount="indefinite"/></circle><circle cx="22" cy="-6" r="1" fill="#FFE6FB"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" begin="0.5s" repeatCount="indefinite"/></circle>
          </g>
          <g transform="translate(100 96)"><animateTransform attributeName="transform" type="scale" values="0.9;1.22;0.9" dur="3.5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/><circle cx="0" cy="0" r="27" fill="url(#nbCore)"/></g>
          <!-- shooting star -->
          <g><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.62;0.72;0.82;1" dur="6.5s" repeatCount="indefinite"/><g transform="translate(64 66)"><animateMotion dur="6.5s" repeatCount="indefinite" keyTimes="0;0.62;0.85;1" keyPoints="0;0;1;1" calcMode="linear" path="M0 0 L74 44"/><path d="M0 0 L-20 -5 L0 0 L-18 6 Z" fill="#fff" opacity="0.8"/><circle r="2.4" fill="#fff"/></g></g>
          <circle cx="100" cy="96" r="72" fill="url(#nbVig)"/>
          <circle cx="100" cy="96" r="72" fill="url(#nbLit)"/>
          <g transform="rotate(20 100 96)"><rect x="-70" y="0" width="46" height="200" fill="url(#shimmer)"><animate attributeName="x" values="-80;-80;220;220" keyTimes="0;0.5;0.78;1" dur="4.2s" repeatCount="indefinite"/></rect></g>
        </g>
        <circle cx="100" cy="96" r="72" fill="url(#nbFres)"/>
        <path d="M56 150 A 72 72 0 0 0 156 122" fill="none" stroke="#DCE2FF" stroke-opacity="0.7" stroke-width="3" stroke-linecap="round" filter="url(#soft)"/>
        <g><animateTransform attributeName="transform" type="translate" values="0 -2;5 4;0 -2" dur="5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/><ellipse cx="72" cy="60" rx="24" ry="15" fill="url(#spec)" transform="rotate(-34 72 60)"/><circle cx="63" cy="51" r="5" fill="#fff"/></g>
      </g>
      <g fill="#FFE9A8"><g transform="translate(152 44)"><path d="M0 -8 L1.8 -1.8 L8 0 L1.8 1.8 L0 8 L-1.8 1.8 L-8 0 L-1.8 -1.8 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite"/></path></g><g transform="translate(44 56)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="3.2s" begin="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3.2s" begin="1.1s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== 3 PHOENIX FEATHER (Rare) — embers rise, flame ripples down shaft, slow flare + burst ===== -->
    <symbol id="g-feather" viewBox="0 0 200 200">
      <ellipse cx="102" cy="176" rx="30" ry="7" fill="#4E1A12" opacity="0.22" filter="url(#soft2)"/>
      <circle cx="104" cy="88" r="66" fill="#F27A3A" opacity="0.16" filter="url(#soft2)"><animate attributeName="opacity" values="0.1;0.28;0.1" dur="3s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="rotate" values="0 96 168;4 96 168;0 96 168;-4 96 168;0 96 168" dur="5.5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
        <path d="M66 168 C 48 116, 66 56, 132 22 C 156 66, 148 130, 96 164 C 86 170, 74 172, 66 168 Z" fill="url(#featherG)"/>
        <path d="M96 164 C 90 118, 100 66, 132 22 C 140 60, 138 110, 108 148 Z" fill="#8A2018" opacity="0.28"/>
        <g clip-path="url(#clipFeather)">
          <path d="M96 168 C 90 120, 96 66, 128 34 M84 150 L108 128 M80 128 L112 104 M80 106 L116 82 M84 84 L118 62 M90 62 L120 44" stroke="#8A2018" stroke-opacity="0.4" stroke-width="2" fill="none"/>
          <path d="M100 160 C 96 116, 102 70, 126 42" stroke="#FFF0B8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>
          <!-- flame ripple travelling DOWN the shaft -->
          <circle r="9" fill="#FFE9A8" opacity="0.85" filter="url(#soft)"><animateMotion dur="2.4s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" path="M126 42 C 102 70, 96 116, 100 160"/><animate attributeName="opacity" values="0;0.9;0" dur="2.4s" repeatCount="indefinite"/></circle>
          <!-- slow overall flare -->
          <path d="M66 168 C 48 116, 66 56, 132 22 C 156 66, 148 130, 96 164 C 86 170, 74 172, 66 168 Z" fill="#FFF3C8"><animate attributeName="opacity" values="0;0.28;0" dur="3.4s" repeatCount="indefinite"/></path>
          <g transform="rotate(20 100 95)"><rect x="-50" y="10" width="30" height="180" fill="url(#shimmer)"><animate attributeName="x" values="-60;-60;200;200" keyTimes="0;0.55;0.82;1" dur="4s" repeatCount="indefinite"/></rect></g>
        </g>
        <circle r="5" fill="#FFE9A8" filter="url(#glow)"><animateMotion dur="2.2s" repeatCount="indefinite" path="M100 160 C 96 116, 102 70, 126 42"/><animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite"/></circle>
      </g>
      <ellipse cx="130" cy="30" rx="16" ry="20" fill="#FFB03A" opacity="0.4" filter="url(#soft2)"><animate attributeName="opacity" values="0.2;0.6;0.3;0.5;0.2" dur="1.1s" repeatCount="indefinite"/></ellipse>
      <!-- periodic flame burst at tip -->
      <path d="M130 30 C 124 18, 136 12, 130 2 C 128 12, 120 16, 130 30 Z" fill="#FFD36A" filter="url(#glow)"><animateTransform attributeName="transform" type="scale" values="0;1.2;0" keyTimes="0;0.5;1" dur="3.6s" begin="0.5s" repeatCount="indefinite" additive="sum" transform-origin="130 22"/><animate attributeName="opacity" values="0;0.95;0" keyTimes="0;0.5;1" dur="3.6s" begin="0.5s" repeatCount="indefinite"/></path>
      <g fill="#FFD36A"><circle cx="130" cy="26" r="2.6"><animateMotion dur="2s" repeatCount="indefinite" path="M0 0 C 5 -22, -5 -40, 3 -60"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.4;1" dur="2s" repeatCount="indefinite"/></circle><circle cx="134" cy="30" r="2"><animateMotion dur="2.6s" begin="0.6s" repeatCount="indefinite" path="M0 0 C -4 -22, 6 -38, -3 -56"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.4;1" dur="2.6s" begin="0.6s" repeatCount="indefinite"/></circle><circle cx="126" cy="28" r="1.7"><animateMotion dur="2.3s" begin="1.3s" repeatCount="indefinite" path="M0 0 C 6 -20, -3 -36, 4 -54"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.4;1" dur="2.3s" begin="1.3s" repeatCount="indefinite"/></circle></g>
    </symbol>

    <!-- ===== 4 ORIGAMI CRANE (Rare) — wings flap+fold, glide lift/dip, foil sheen + hue shift ===== -->
    <symbol id="g-crane" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="44" ry="8" fill="#123A3E" opacity="0.2" filter="url(#soft2)"><animate attributeName="rx" values="44;36;44" dur="4.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.12;0.2" dur="4.4s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="96" r="70" fill="#4FD8C8" opacity="0.14" filter="url(#soft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 8;0 -12;0 8" keyTimes="0;0.5;1" dur="4.4s" calcMode="spline" keySplines="0.36 0 0.5 1;0.5 0 0.64 1" repeatCount="indefinite" additive="sum"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-4 100 110;4 100 110;-4 100 110" dur="4.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M40 120 L96 96 L84 150 Z" fill="url(#foilDark)"/>
        <path d="M96 96 L150 40 L128 86 L150 96 L104 110 Z" fill="url(#foilMid)"/>
        <path d="M96 96 L128 86 L104 110 Z" fill="url(#foilDark)" opacity="0.85"/>
        <path d="M150 40 L170 33 L157 49 Z" fill="#F49ADA"/>
        <path d="M150 40 L170 33 L162 41 Z" fill="#fff" opacity="0.4"/>
        <!-- left wing folds (rotate + scaleY to fake the fold) -->
        <g><animateTransform attributeName="transform" type="rotate" values="0 92 100;-16 92 100;0 92 100" dur="2.2s" calcMode="spline" keySplines="0.36 0 0.5 1;0.5 0 0.64 1" repeatCount="indefinite" additive="sum"/><g transform="translate(92 100)"><animateTransform attributeName="transform" type="scale" values="1 1;1 0.78;1 1" dur="2.2s" calcMode="spline" keySplines="0.36 0 0.5 1;0.5 0 0.64 1" repeatCount="indefinite" additive="sum"/><g transform="translate(-92 -100)"><path d="M92 100 L52 54 L108 90 Z" fill="url(#foilLit)"/><path d="M92 100 L70 74 L108 90 Z" fill="#fff" opacity="0.3"/></g></g></g>
        <!-- right wing folds -->
        <g><animateTransform attributeName="transform" type="rotate" values="0 104 100;16 104 100;0 104 100" dur="2.2s" calcMode="spline" keySplines="0.36 0 0.5 1;0.5 0 0.64 1" repeatCount="indefinite" additive="sum"/><g transform="translate(104 100)"><animateTransform attributeName="transform" type="scale" values="1 1;1 0.78;1 1" dur="2.2s" calcMode="spline" keySplines="0.36 0 0.5 1;0.5 0 0.64 1" repeatCount="indefinite" additive="sum"/><g transform="translate(-104 -100)"><path d="M104 100 L148 60 L118 96 Z" fill="url(#foilMid)"/></g></g></g>
        <g clip-path="url(#clipCrane)">
          <path d="M40 120 L96 78 L150 40 L128 86 L150 96 L104 110 L96 150 L80 112 Z" fill="#6BE0FF"><animate attributeName="opacity" values="0;0.3;0;0" keyTimes="0;0.25;0.5;1" dur="5s" repeatCount="indefinite"/></path>
          <path d="M40 120 L96 78 L150 40 L128 86 L150 96 L104 110 L96 150 L80 112 Z" fill="#F0A0D8"><animate attributeName="opacity" values="0;0;0.3;0" keyTimes="0;0.5;0.75;1" dur="5s" repeatCount="indefinite"/></path>
          <rect x="-40" y="0" width="30" height="200" fill="url(#shimmer)" transform="rotate(14 100 100)"><animate attributeName="x" values="-50;-50;210;210" keyTimes="0;0.55;0.82;1" dur="4.4s" repeatCount="indefinite"/></rect>
        </g>
      </g>
      </g>
    </symbol>

    <!-- ===== 5 CLOCKWORK HEART (Epic) — meshing gears, lub-dub, glints, winding key ===== -->
    <symbol id="g-heart" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="40" ry="8" fill="#3A2810" opacity="0.24" filter="url(#soft2)"><animate attributeName="rx" values="40;44;40;42;40" keyTimes="0;0.1;0.2;0.32;1" dur="1.6s" repeatCount="indefinite"/></ellipse>
      <circle cx="98" cy="98" r="74" fill="#D9A24B" opacity="0.16" filter="url(#soft2)"><animate attributeName="opacity" values="0.12;0.28;0.14;0.26;0.12" keyTimes="0;0.1;0.2;0.32;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="100" cy="98" r="72" fill="none" stroke="#F0CE86" stroke-width="2.5"><animate attributeName="r" values="70;88;88" keyTimes="0;0.7;1" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" keyTimes="0;0.7;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <g transform="translate(100 100)"><animateTransform attributeName="transform" type="scale" values="1;1.12;1.02;1.14;1;1" keyTimes="0;0.1;0.18;0.28;0.44;1" dur="1.6s" calcMode="spline" keySplines="0.2 0 0.3 1;0.4 0 0.6 1;0.2 0 0.3 1;0.3 0 0.6 1;0.5 0 0.5 1" repeatCount="indefinite" additive="sum"/>
        <g transform="translate(-100 -100)">
          <path d="M100 152 C 38 108, 42 56, 78 56 C 92 56, 100 68, 100 78 C 100 68, 108 56, 122 56 C 158 56, 162 108, 100 152 Z" fill="url(#brassG)"/>
          <path d="M100 152 C 38 108, 42 56, 78 56 C 92 56, 100 68, 100 78" fill="none" stroke="#FFF2CC" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
          <path d="M100 78 C 100 68, 108 56, 122 56 C 158 56, 162 108, 100 152" fill="none" stroke="#7E5414" stroke-width="3" opacity="0.4" stroke-linecap="round"/>
          <!-- winding key on right -->
          <g transform="translate(150 92)"><animateTransform attributeName="transform" type="rotate" values="0;0;90;90" keyTimes="0;0.55;0.8;1" dur="4.5s" repeatCount="indefinite" additive="sum"/><rect x="-2" y="0" width="4" height="16" fill="#B27D2A"/><circle cx="0" cy="0" r="7" fill="none" stroke="#B27D2A" stroke-width="4"/></g>
          <circle cx="100" cy="98" r="27" fill="#4A3210"/><circle cx="100" cy="98" r="27" fill="none" stroke="#7E5414" stroke-width="2"/>
          <g transform="translate(100 98)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" additive="sum"/><g fill="url(#gearG)"><circle cx="0" cy="0" r="16"/><rect x="-3" y="-20" width="6" height="9" rx="1.5"/><rect x="-3" y="11" width="6" height="9" rx="1.5"/><rect x="-20" y="-3" width="9" height="6" rx="1.5"/><rect x="11" y="-3" width="9" height="6" rx="1.5"/><rect x="-16" y="-14" width="7" height="6" rx="1.5" transform="rotate(45)"/><rect x="9" y="-14" width="7" height="6" rx="1.5" transform="rotate(-45)"/></g><circle cx="0" cy="0" r="6" fill="#4A3210"/><circle cx="-4" cy="-4" r="2" fill="#FFF2CC" opacity="0.7"/></g>
          <g transform="translate(75 120)"><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="3.6s" repeatCount="indefinite" additive="sum"/><g fill="url(#gearG)"><circle cx="0" cy="0" r="10"/><rect x="-2.5" y="-13" width="5" height="6" rx="1.5"/><rect x="-2.5" y="7" width="5" height="6" rx="1.5"/><rect x="-13" y="-2.5" width="6" height="5" rx="1.5"/><rect x="7" y="-2.5" width="6" height="5" rx="1.5"/></g><circle cx="0" cy="0" r="3.5" fill="#4A3210"/></g>
          <g clip-path="url(#clipHeart)"><rect x="-40" y="0" width="26" height="200" fill="url(#shimmer)" transform="rotate(16 100 100)"><animate attributeName="x" values="-50;-50;210;210" keyTimes="0;0.5;0.78;1" dur="3.6s" repeatCount="indefinite"/></rect></g>
          <ellipse cx="74" cy="72" rx="12" ry="7" fill="#fff" opacity="0.28" transform="rotate(-30 74 72)"/>
        </g>
      </g>
      <g fill="#F0CE86"><circle cx="150" cy="90" r="1.8"><animate attributeName="cy" values="100;58" dur="3.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="3.8s" repeatCount="indefinite"/></circle><circle cx="50" cy="90" r="1.5"><animate attributeName="cy" values="100;58" dur="4.8s" begin="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="4.8s" begin="1.8s" repeatCount="indefinite"/></circle></g>
    </symbol>

    <!-- ===== 6 AURORA JELLYFISH (Epic) — swim pulse, undulating tentacles, aurora flow, sparkles ===== -->
    <symbol id="g-jelly" viewBox="0 0 200 200">
      <ellipse cx="100" cy="184" rx="34" ry="6" fill="#0E3A38" opacity="0.18" filter="url(#soft2)"><animate attributeName="rx" values="34;28;34" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="86" r="68" fill="#4FE0C0" opacity="0.18" filter="url(#soft2)"><animate attributeName="fill" values="#4FE0C0;#7CF0A8;#5FD0E8;#4FE0C0" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.14;0.26;0.14" dur="4s" repeatCount="indefinite"/></circle>
      <circle cx="100" cy="84" r="70" fill="none" stroke="#8CF0D8" stroke-width="2.5"><animate attributeName="r" values="58;82;82" keyTimes="0;0.7;1" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0;0" keyTimes="0;0.7;1" dur="4s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 12;0 -12;0 12" keyTimes="0;0.5;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <g stroke-linecap="round" fill="none">
          <path stroke="#5FE0C8" stroke-width="4" opacity="0.85"><animate attributeName="d" values="M78 108 C 70 130, 84 144, 74 164;M78 108 C 86 130, 70 146, 82 166;M78 108 C 70 130, 84 144, 74 164" dur="3.4s" repeatCount="indefinite"/></path>
          <path stroke="#8CF0D8" stroke-width="4" opacity="0.9"><animate attributeName="d" values="M90 112 C 84 136, 96 150, 88 170;M90 112 C 96 136, 84 152, 94 172;M90 112 C 84 136, 96 150, 88 170" dur="3.4s" begin="0.25s" repeatCount="indefinite"/></path>
          <path stroke="#B0FFE8" stroke-width="4.5" opacity="0.95"><animate attributeName="d" values="M100 114 C 100 138, 100 154, 100 174;M100 114 C 104 138, 96 156, 100 176;M100 114 C 100 138, 100 154, 100 174" dur="3.4s" begin="0.12s" repeatCount="indefinite"/></path>
          <path stroke="#8CF0D8" stroke-width="4" opacity="0.9"><animate attributeName="d" values="M110 112 C 116 136, 104 150, 112 170;M110 112 C 104 136, 116 152, 106 172;M110 112 C 116 136, 104 150, 112 170" dur="3.4s" begin="0.25s" repeatCount="indefinite"/></path>
          <path stroke="#5FE0C8" stroke-width="4" opacity="0.85"><animate attributeName="d" values="M122 108 C 130 130, 116 144, 126 164;M122 108 C 116 130, 130 146, 120 166;M122 108 C 130 130, 116 144, 126 164" dur="3.4s" repeatCount="indefinite"/></path>
        </g>
        <g transform="translate(100 66)"><animateTransform attributeName="transform" type="scale" values="1 1;1.1 0.82;1 1;0.92 1.12;1 1" keyTimes="0;0.25;0.5;0.75;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
          <g transform="translate(-100 -66)">
            <path d="M46 98 C 46 50, 154 50, 154 98 C 154 106, 148 112, 138 110 C 128 108, 122 112, 116 112 C 108 112, 104 108, 100 108 C 96 108, 92 112, 84 112 C 78 112, 72 108, 62 110 C 52 112, 46 106, 46 98 Z" fill="url(#jellyBell)"/>
            <g clip-path="url(#clipBell)"><rect x="10" y="44" width="180" height="70" fill="url(#auroraFlow)" opacity="0.5"><animateTransform attributeName="transform" type="translate" values="-40 0;40 0;-40 0" dur="6s" repeatCount="indefinite"/></rect></g>
            <path d="M46 98 C 46 50, 154 50, 154 98 C 130 84, 70 84, 46 98 Z" fill="#fff" opacity="0.16"/>
            <ellipse cx="80" cy="72" rx="18" ry="11" fill="#fff" opacity="0.55" transform="rotate(-18 80 72)"/>
            <circle cx="80" cy="90" r="4" fill="#EAFFF8" opacity="0.7"/><circle cx="118" cy="86" r="3" fill="#EAFFF8" opacity="0.6"/><circle cx="100" cy="94" r="3.5" fill="#EAFFF8" opacity="0.65"/>
          </g>
        </g>
      </g>
      <g fill="#B0FFE8"><circle cx="70" cy="90" r="1.8"><animate attributeName="cy" values="100;34" dur="4.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="4.5s" repeatCount="indefinite"/></circle><circle cx="132" cy="86" r="1.6"><animate attributeName="cy" values="96;30" dur="5.5s" begin="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="5.5s" begin="2.2s" repeatCount="indefinite"/></circle><circle cx="100" cy="120" r="1.5"><animate attributeName="cy" values="126;60" dur="5s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" dur="5s" begin="1s" repeatCount="indefinite"/></circle></g>
    </symbol>

    <!-- ===== 7 CRYSTAL FOX (Legendary flagship) — rainbow refraction, prismatic burst, head turn, tail trail ===== -->
    <symbol id="g-fox" viewBox="0 0 200 200">
      <!-- pedestal glow -->
      <ellipse cx="100" cy="168" rx="46" ry="11" fill="#FF6ACB" opacity="0.3" filter="url(#soft2)"><animate attributeName="opacity" values="0.2;0.42;0.2" dur="4s" repeatCount="indefinite"/><animate attributeName="rx" values="42;50;42" dur="4s" repeatCount="indefinite"/></ellipse>
      <ellipse cx="100" cy="170" rx="40" ry="8" fill="#3A0F2E" opacity="0.22" filter="url(#soft2)"/>
      <circle cx="100" cy="94" r="84" fill="#EC6ABF" opacity="0.2" filter="url(#soft2)"><animate attributeName="opacity" values="0.14;0.3;0.14" dur="4s" repeatCount="indefinite"/></circle>
      <!-- prismatic burst (periodic) -->
      <g transform="translate(100 96)">
        <circle r="20" fill="none" stroke="url(#rainbowG)" stroke-width="4"><animate attributeName="r" values="20;92;92" keyTimes="0;0.4;1" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" keyTimes="0;0.2;0.5" dur="5s" repeatCount="indefinite"/><animate attributeName="stroke-width" values="6;1;1" keyTimes="0;0.4;1" dur="5s" repeatCount="indefinite"/></circle>
        <g><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.12;0.4;1" dur="5s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="scale" values="0.5;1.5;1.5" keyTimes="0;0.4;1" dur="5s" repeatCount="indefinite"/>
          <g stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.9"><path d="M0 -40 L0 -54"/><path d="M0 40 L0 54"/><path d="M-40 0 L-54 0"/><path d="M40 0 L54 0"/><path d="M28 -28 L38 -38"/><path d="M-28 -28 L-38 -38"/><path d="M28 28 L38 38"/><path d="M-28 28 L-38 38"/></g>
        </g>
      </g>
      <g><animateTransform attributeName="transform" type="translate" values="0 5;0 -7;0 5" keyTimes="0;0.5;1" dur="5.5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="#FFB0E6" stroke-width="2.5"><animate attributeName="r" values="70;92;92" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/></circle>
        <!-- majestic slow yaw (fake 3D via scaleX) -->
        <g transform="translate(100 100)"><animateTransform attributeName="transform" type="scale" values="1 1;0.94 1;1 1;0.94 1;1 1" keyTimes="0;0.25;0.5;0.75;1" dur="9s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/><g transform="translate(-100 -100)">
          <!-- inner glow -->
          <ellipse cx="100" cy="104" rx="30" ry="40" fill="url(#foxInner)"><animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.4s" repeatCount="indefinite"/></ellipse>
          <!-- tail with light trail -->
          <g><animateTransform attributeName="transform" type="rotate" values="-6 118 132;10 118 132;-6 118 132" dur="3.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
            <path d="M118 132 L172 100 L160 152 L128 148 Z" fill="url(#foxMid)" opacity="0.3" filter="url(#soft)"/>
            <path d="M118 132 L166 104 L152 152 L128 146 Z" fill="url(#foxMid)"/>
            <path d="M152 116 L166 104 L158 128 Z" fill="url(#foxLit)"/>
            <circle cx="160" cy="118" r="2.6" fill="#fff"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite"/></circle>
          </g>
          <!-- body facets (more of them) -->
          <path d="M100 44 L128 70 L138 132 L100 150 L62 132 L72 70 Z" fill="url(#foxMid)"/>
          <path d="M100 44 L128 70 L100 96 L72 70 Z" fill="url(#foxLit)"/>
          <path d="M72 70 L100 96 L82 118 L62 132 Z" fill="url(#foxDark)"/>
          <path d="M138 132 L118 118 L100 96 L128 70 Z" fill="url(#foxDark)" opacity="0.9"/>
          <path d="M100 96 L118 118 L100 150 L82 118 Z" fill="url(#foxMid)"/>
          <path d="M82 118 L100 150 L62 132 Z" fill="url(#foxMid)" opacity="0.85"/>
          <path d="M118 118 L138 132 L100 150 Z" fill="url(#foxLit)" opacity="0.75"/>
          <!-- HEAD group (turns) -->
          <g><animateTransform attributeName="transform" type="rotate" values="-5 100 78;5 100 78;-5 100 78" dur="6s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
            <!-- ears (twitch) -->
            <g><animateTransform attributeName="transform" type="rotate" values="0 76 56;0 76 56;-7 76 56;0 76 56;0 76 56" keyTimes="0;0.5;0.58;0.66;1" dur="4s" repeatCount="indefinite" additive="sum"/><path d="M74 66 L64 32 L92 56 Z" fill="url(#foxLit)"/><path d="M74 62 L70 44 L84 56 Z" fill="url(#foxDark)" opacity="0.6"/></g>
            <g><animateTransform attributeName="transform" type="rotate" values="0 124 56;0 124 56;7 124 56;0 124 56;0 124 56" keyTimes="0;0.5;0.6;0.7;1" dur="4s" begin="0.3s" repeatCount="indefinite" additive="sum"/><path d="M126 66 L136 32 L108 56 Z" fill="url(#foxMid)"/><path d="M126 62 L130 44 L116 56 Z" fill="url(#foxDark)" opacity="0.6"/></g>
            <path d="M100 96 L88 112 L100 122 L112 112 Z" fill="#FFEAF8"/>
            <!-- eyes with glint -->
            <path d="M78 78 L88 74 L86 84 Z" fill="#5A1240"/><path d="M122 78 L112 74 L114 84 Z" fill="#5A1240"/>
            <circle cx="83" cy="78" r="1.4" fill="#fff"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.3;0.36;0.42;1" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="117" cy="78" r="1.4" fill="#fff"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.3;0.36;0.42;1" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="100" cy="106" r="2.6" fill="#5A1240"/>
          </g>
          <!-- facet edges -->
          <path d="M100 44 L100 96 M72 70 L128 70 M62 132 L82 118 L100 96 L118 118 L138 132 M100 96 L72 70 M100 96 L128 70 M100 96 L100 150" stroke="#fff" stroke-opacity="0.32" stroke-width="1.4" fill="none"/>
          <!-- RAINBOW refraction sweep across facets -->
          <g clip-path="url(#clipFox)"><rect x="-60" y="0" width="70" height="200" fill="url(#rainbowG)" opacity="0.55" transform="rotate(16 100 95)"><animate attributeName="x" values="-70;220" dur="4.5s" repeatCount="indefinite"/></rect></g>
          <g clip-path="url(#clipFox)"><rect x="-40" y="0" width="26" height="200" fill="url(#shimmer)" transform="rotate(16 100 95)"><animate attributeName="x" values="-50;-50;210;210" keyTimes="0;0.45;0.72;1" dur="3.6s" repeatCount="indefinite"/></rect></g>
        </g></g>
      </g>
      <g fill="#FFF3CC"><g transform="translate(150 50)"><path d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite"/></path></g><g transform="translate(48 60)"><path d="M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.8s" begin="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" begin="0.9s" repeatCount="indefinite"/></path></g><g transform="translate(120 40)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="3s" begin="1.7s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.7s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== 8 COMET CORE (Rare) — spin, orbiting comet, glow pulse, burst + streak ===== -->
    <symbol id="g-comet" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="32" ry="7" fill="#3A2E10" opacity="0.2" filter="url(#soft2)"/>
      <circle cx="100" cy="88" r="68" fill="#F0C86A" opacity="0.18" filter="url(#soft2)"><animate attributeName="opacity" values="0.12;0.28;0.12" dur="3.2s" repeatCount="indefinite"/></circle>
      <!-- streak across -->
      <g opacity="0.9"><g transform="translate(24 40)"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.7;0.78;0.88;1" dur="4.5s" repeatCount="indefinite"/><animateMotion dur="4.5s" repeatCount="indefinite" keyTimes="0;0.7;0.9;1" keyPoints="0;0;1;1" calcMode="linear" path="M0 0 L150 100"/><path d="M0 0 L-34 -8 L0 0 L-30 9 Z" fill="#FFF3CC"/><circle r="3" fill="#fff"/></g></g>
      <g><animateTransform attributeName="transform" type="translate" values="0 5;0 -6;0 5" dur="5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <g transform="translate(100 88)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" additive="sum"/>
          <g transform="translate(-100 -88)">
            <polygon points="100,26 132,74 116,150 84,150 68,74" fill="url(#comMid)"/>
            <polygon points="100,26 132,74 100,88" fill="url(#comLit)"/>
            <polygon points="100,26 100,88 68,74" fill="url(#comLit)" opacity="0.6"/>
            <polygon points="68,74 100,88 84,150" fill="url(#comDark)"/>
            <polygon points="132,74 116,150 100,88" fill="url(#comDark)" opacity="0.8"/>
            <polygon points="84,150 116,150 100,88" fill="url(#comMid)" opacity="0.7"/>
            <path d="M100 26 L100 88 M68 74 L132 74 M68 74 L100 88 L132 74 M84 150 L100 88 L116 150" stroke="#fff" stroke-opacity="0.4" stroke-width="1.3" fill="none"/>
            <ellipse cx="92" cy="52" rx="7" ry="16" fill="#fff" opacity="0.4" transform="rotate(-12 92 52)"/>
          </g>
          <g clip-path="url(#clipComet)"><rect x="-40" y="0" width="24" height="200" fill="url(#shimmer)" transform="rotate(10 100 90)"><animate attributeName="x" values="-50;-50;210;210" keyTimes="0;0.55;0.82;1" dur="4s" repeatCount="indefinite"/></rect></g>
        </g>
      </g>
      <g><animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto" path="M100 88 m 0 -70 a 72 48 0 1 1 -0.1 0 Z"/><path d="M0 0 L-30 -4 L0 0 L-28 5 Z" fill="#FFF3CC" opacity="0.75" filter="url(#glow)"/><circle r="4" fill="#fff" filter="url(#glow)"/></g>
      <g transform="translate(100 88)" fill="#FFF3CC"><path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"><animateTransform attributeName="transform" type="scale" values="0;1.3;0" keyTimes="0;0.5;1" dur="3s" begin="0.6s" repeatCount="indefinite" additive="sum"/><animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1" dur="3s" begin="0.6s" repeatCount="indefinite"/></path></g>
    </symbol>

    <!-- ===== 9 EMERALD DRAGON EGG (Epic) — hops, cracks open to inner glow + eye peek, reseals ===== -->
    <symbol id="g-egg" viewBox="0 0 200 200">
      <ellipse cx="100" cy="176" rx="38" ry="8" fill="#0E3A22" opacity="0.24" filter="url(#soft2)"><animate attributeName="rx" values="38;30;42;38" keyTimes="0;0.4;0.55;1" dur="3s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="100" r="72" fill="#4FC98A" opacity="0.16" filter="url(#soft2)"><animate attributeName="opacity" values="0.1;0.26;0.1" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx="100" cy="98" r="72" fill="none" stroke="#9BFFC4" stroke-width="2.5"><animate attributeName="r" values="66;88;88" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0;0" keyTimes="0;0.7;1" dur="3s" repeatCount="indefinite"/></circle>
      <!-- hop + squash -->
      <g transform="translate(100 118)"><animateTransform attributeName="transform" type="translate" values="100 118;100 100;100 118;100 118" keyTimes="0;0.4;0.55;1" dur="3s" calcMode="spline" keySplines="0.3 0 0.2 1;0.6 0 0.7 1;0.5 0 0.5 1" repeatCount="indefinite"/>
        <g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;0.94 1.06;1.08 0.9;1 1;1 1" keyTimes="0;0.35;0.42;0.58;0.7;1" dur="3s" calcMode="spline" keySplines="0.5 0 0.5 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.5 0 0.5 1" repeatCount="indefinite" additive="sum"/>
        <g transform="translate(-100 -118)">
          <!-- inner glow revealed in crack -->
          <ellipse cx="100" cy="72" rx="20" ry="16" fill="url(#eggInner)"><animate attributeName="opacity" values="0.2;0.2;1;1;0.2" keyTimes="0;0.42;0.5;0.62;0.72" dur="3s" repeatCount="indefinite"/></ellipse>
          <!-- eye peek -->
          <g><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.48;0.54;0.6;1" dur="3s" repeatCount="indefinite"/><ellipse cx="100" cy="72" rx="7" ry="4" fill="#0E3A22"/><ellipse cx="100" cy="72" rx="2.6" ry="4" fill="#BFFFD8"/><circle cx="99" cy="70" r="1" fill="#fff"/></g>
          <!-- lower body -->
          <path d="M100 78 L120 74 L140 80 C 150 100, 154 118, 154 118 C 154 150, 130 172, 100 172 C 70 172, 46 150, 46 118 C 46 118, 50 100, 60 80 L80 74 Z" fill="url(#eggG)"/>
          <g stroke="#0E5030" stroke-opacity="0.4" stroke-width="2" fill="none"><path d="M62 92 Q76 100 70 114 Q84 122 78 138 M138 92 Q124 100 130 114 Q116 122 122 138 M80 128 Q94 136 88 152 M120 128 Q106 136 112 152"/></g>
          <g stroke="#9BFFC4" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"><path d="M100 84 L92 100 L104 116 L94 134 L106 150"/><path d="M104 116 L120 110 M94 134 L78 130"/><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/></g>
          <!-- top cap (lifts + tilts to crack open) -->
          <g><animateTransform attributeName="transform" type="rotate" values="0 60 76;0 60 76;-12 60 76;-12 60 76;0 60 76;0 60 76" keyTimes="0;0.42;0.5;0.6;0.68;1" dur="3s" calcMode="spline" keySplines="0.5 0 0.5 1;0.3 0 0.4 1;0.5 0 0.5 1;0.4 0 0.6 1;0.5 0 0.5 1" repeatCount="indefinite" additive="sum"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -6;0 -6;0 0;0 0" keyTimes="0;0.42;0.5;0.6;0.68;1" dur="3s" repeatCount="indefinite" additive="sum"/>
            <path d="M100 30 C 130 30, 144 58, 148 80 L140 80 L128 74 L116 80 L104 74 L92 80 L80 74 L68 80 L60 78 L52 80 C 56 58, 70 30, 100 30 Z" fill="url(#eggG)"/>
            <ellipse cx="82" cy="52" rx="14" ry="9" fill="#fff" opacity="0.4" transform="rotate(-24 82 52)"/>
            <path d="M100 30 C 124 30, 138 56, 142 78" fill="none" stroke="#9BFFC4" stroke-width="2" opacity="0.5" filter="url(#glow)"/>
          </g>
        </g>
        </g>
      </g>
      <g fill="#9BFFC4"><circle cx="150" cy="94" r="1.8"><animate attributeName="cy" values="104;58" dur="4.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="4.5s" repeatCount="indefinite"/></circle><circle cx="50" cy="94" r="1.6"><animate attributeName="cy" values="104;58" dur="5.5s" begin="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="5.5s" begin="2s" repeatCount="indefinite"/></circle></g>
    </symbol>

    <!-- ===== 10 SUNSET BALLOON (Uncommon) — bob/drift, basket sway, burner flame, clouds, rise ===== -->
    <symbol id="g-balloon" viewBox="0 0 200 200">
      <ellipse cx="100" cy="186" rx="26" ry="5" fill="#4E1A18" opacity="0.18" filter="url(#soft2)"><animate attributeName="rx" values="26;20;26" dur="6s" repeatCount="indefinite"/></ellipse>
      <g fill="#fff" opacity="0.24"><ellipse cx="44" cy="66" rx="22" ry="10"><animateTransform attributeName="transform" type="translate" values="0 0;-18 0;0 0" dur="11s" repeatCount="indefinite"/></ellipse><ellipse cx="160" cy="108" rx="26" ry="12"><animateTransform attributeName="transform" type="translate" values="0 0;20 0;0 0" dur="13s" repeatCount="indefinite"/></ellipse></g>
      <g><animateTransform attributeName="transform" type="translate" values="0 8;7 -12;0 6;-7 -10;0 8" keyTimes="0;0.25;0.5;0.75;1" dur="6.5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M100 24 C 140 24, 152 62, 152 88 C 152 118, 124 140, 100 140 C 76 140, 48 118, 48 88 C 48 62, 60 24, 100 24 Z" fill="url(#balloonG)"/>
        <path d="M100 24 C 88 58, 88 108, 100 140 M100 24 C 112 58, 112 108, 100 140 M78 28 C 68 62, 74 110, 88 136 M122 28 C 132 62, 126 110, 112 136" stroke="#A83A26" stroke-opacity="0.32" stroke-width="2" fill="none"/>
        <path d="M100 24 C 76 24, 60 50, 54 82 C 66 60, 84 42, 100 40 Z" fill="#fff" opacity="0.22"/>
        <ellipse cx="78" cy="54" rx="12" ry="20" fill="#fff" opacity="0.3" transform="rotate(-16 78 54)"/>
        <!-- burner flame -->
        <path d="M100 140 C 96 148, 104 148, 100 140 Z"/><path d="M100 142 C 95 150, 96 156, 100 160 C 104 156, 105 150, 100 142 Z" fill="#FFD36A" filter="url(#glow)"><animate attributeName="opacity" values="0.5;1;0.6;1;0.5" dur="0.8s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="scale" values="1 1;1 1.3;1 1" dur="0.8s" repeatCount="indefinite" additive="sum" transform-origin="100 142"/></path>
        <path d="M82 138 L96 158 M118 138 L104 158" stroke="#7A5420" stroke-width="1.6"/>
        <g><animateTransform attributeName="transform" type="rotate" values="-3.5 100 140;3.5 100 140;-3.5 100 140" dur="3.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/><path d="M86 156 L114 156 L110 174 L90 174 Z" fill="url(#basketG)"/><path d="M86 161 L114 161 M95 156 L93 174 M105 156 L107 174" stroke="#5A3E14" stroke-opacity="0.5" stroke-width="1"/><rect x="86" y="156" width="28" height="4" fill="#E0B878" opacity="0.6"/></g>
      </g>
    </symbol>

    <!-- ===== 11 RETRO CASSETTE (Uncommon) — reels spin, VHS scanline, wobble, glitch flicker ===== -->
    <symbol id="g-cassette" viewBox="0 0 200 200">
      <ellipse cx="100" cy="164" rx="52" ry="8" fill="#123A30" opacity="0.2" filter="url(#soft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 0;3 0;-2 0;0 0;0 0" keyTimes="0;0.03;0.06;0.1;1" dur="5s" repeatCount="indefinite" additive="sum"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-1.8 100 100;1.8 100 100;-1.8 100 100" dur="5.5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
        <rect x="34" y="52" width="132" height="96" rx="14" fill="url(#cassG)"/>
        <rect x="34" y="52" width="132" height="10" rx="5" fill="#fff" opacity="0.35"/>
        <rect x="38" y="138" width="124" height="8" rx="4" fill="#123A30" opacity="0.4"/>
        <rect x="48" y="70" width="104" height="40" rx="8" fill="#EEF8F3"/>
        <rect x="48" y="70" width="104" height="13" rx="6" fill="#F0A93A" opacity="0.9"/>
        <g transform="translate(76 90)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.6s" repeatCount="indefinite" additive="sum"/><circle cx="0" cy="0" r="14" fill="#253232"/><g stroke="#9FE8D2" stroke-width="3"><path d="M0 -11 L0 11 M-11 0 L11 0 M-8 -8 L8 8 M8 -8 L-8 8"/></g><circle cx="0" cy="0" r="4.5" fill="#EEF8F3"/></g>
        <g transform="translate(124 90)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.6s" repeatCount="indefinite" additive="sum"/><circle cx="0" cy="0" r="14" fill="#253232"/><g stroke="#9FE8D2" stroke-width="3"><path d="M0 -11 L0 11 M-11 0 L11 0 M-8 -8 L8 8 M8 -8 L-8 8"/></g><circle cx="0" cy="0" r="4.5" fill="#EEF8F3"/></g>
        <rect x="60" y="124" width="80" height="16" rx="4" fill="#253232" opacity="0.9"/>
        <circle cx="52" cy="132" r="3" fill="#253232"/><circle cx="148" cy="132" r="3" fill="#253232"/>
        <g clip-path="url(#clipCass)">
          <rect x="34" y="-20" width="132" height="12" fill="#fff" opacity="0.22"><animate attributeName="y" values="48;150" dur="2.6s" repeatCount="indefinite"/></rect>
          <!-- glitch flash -->
          <rect x="34" y="52" width="132" height="96" fill="#FF4DA0" opacity="0"><animate attributeName="opacity" values="0;0;0.22;0;0.14;0" keyTimes="0;0.86;0.88;0.9;0.92;1" dur="4.5s" repeatCount="indefinite"/><animate attributeName="x" values="34;40;30;34" keyTimes="0;0.88;0.9;0.92" dur="4.5s" repeatCount="indefinite"/></rect>
          <rect x="34" y="52" width="132" height="96" fill="#4DE0FF" opacity="0"><animate attributeName="opacity" values="0;0;0.18;0;0.1;0" keyTimes="0;0.87;0.89;0.91;0.93;1" dur="4.5s" repeatCount="indefinite"/><animate attributeName="x" values="34;28;40;34" keyTimes="0;0.89;0.91;0.93" dur="4.5s" repeatCount="indefinite"/></rect>
        </g>
      </g>
      </g>
    </symbol>

    <!-- ===== 12 OCEAN PEARL (Rare) — shell opens/closes, iridescent sweep, bubble, caustics ===== -->
    <symbol id="g-pearl" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="44" ry="8" fill="#123044" opacity="0.2" filter="url(#soft2)"/>
      <circle cx="100" cy="104" r="70" fill="#7FB0E0" opacity="0.14" filter="url(#soft2)"/>
      <!-- caustics -->
      <g opacity="0.4" filter="url(#soft2)"><ellipse cx="70" cy="70" rx="18" ry="6" fill="#CDE8FF"><animateTransform attributeName="transform" type="translate" values="0 0;16 6;0 0" dur="7s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.5;0.2" dur="7s" repeatCount="indefinite"/></ellipse><ellipse cx="134" cy="86" rx="14" ry="5" fill="#CDE8FF"><animateTransform attributeName="transform" type="translate" values="0 0;-14 4;0 0" dur="9s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.45;0.2" dur="9s" repeatCount="indefinite"/></ellipse></g>
      <circle cx="128" cy="120" r="3.5" fill="none" stroke="#DCEBFF" stroke-width="1.5" opacity="0.8"><animate attributeName="cy" values="120;44" dur="4.5s" repeatCount="indefinite"/><animate attributeName="r" values="3.5;3.5;5;0" keyTimes="0;0.75;0.92;1" dur="4.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.1;0.9;1" dur="4.5s" repeatCount="indefinite"/></circle>
      <path d="M28 118 C 34 150, 68 164, 100 164 C 132 164, 166 150, 172 118 C 140 132, 60 132, 28 118 Z" fill="url(#shellDark)"/>
      <path d="M28 118 C 60 130, 140 130, 172 118" fill="none" stroke="#3E6684" stroke-width="2" opacity="0.5"/>
      <path d="M42 128 L52 150 M64 134 L70 158 M100 136 L100 162 M136 134 L130 158 M158 128 L148 150" stroke="#3E6684" stroke-opacity="0.4" stroke-width="1.6"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 1;0 -3;0 1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="104" r="30" fill="url(#pearlG)"/>
        <circle cx="100" cy="104" r="30" fill="url(#vigDark)"/>
        <g clip-path="url(#clipPearl)"><ellipse cx="90" cy="92" rx="11" ry="8" fill="#fff" opacity="0.9"/><ellipse cx="112" cy="120" rx="20" ry="11" fill="#F0D0FF" opacity="0.45"><animate attributeName="cx" values="74;128;74" dur="3.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/></ellipse><rect x="-20" y="72" width="18" height="64" fill="url(#shimmer)" transform="rotate(12 100 104)"><animate attributeName="x" values="-30;150" dur="3.4s" repeatCount="indefinite"/></rect></g>
        <circle cx="100" cy="104" r="30" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="1"/>
      </g>
      <!-- top valve opens/closes clearly -->
      <g><animateTransform attributeName="transform" type="rotate" values="0 100 118;-13 100 118;0 100 118" keyTimes="0;0.5;1" dur="5s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
        <path d="M28 118 C 34 80, 68 60, 100 60 C 132 60, 166 80, 172 118 C 140 100, 60 100, 28 118 Z" fill="url(#shellLit)"/>
        <path d="M100 60 L86 116 M100 60 L100 118 M100 60 L116 116 M100 60 L58 108 M100 60 L142 108 M100 60 L72 112 M100 60 L128 112" stroke="#5E86A4" stroke-opacity="0.45" stroke-width="2" fill="none"/>
        <path d="M28 118 C 60 104, 140 104, 172 118" fill="none" stroke="#3E6684" stroke-width="2.5" opacity="0.55"/>
        <ellipse cx="74" cy="80" rx="18" ry="7" fill="#fff" opacity="0.45"/>
      </g>
    </symbol>

  </defs></svg>`;

  var CATALOG = [
    {n:1, name:'Thread Spool',       sym:'g-spool',    g1:'#6E5DD6', g2:'#3A2E7A', r:'EPIC',      ed:'#0142', pr:'250'},
    {n:2, name:'Nebula Orb',         sym:'g-nebula',   g1:'#4E63C4', g2:'#1C2456', r:'LEGENDARY', ed:'#0007', pr:'900'},
    {n:3, name:'Phoenix Feather',    sym:'g-feather',  g1:'#C4552E', g2:'#4E2626', r:'RARE',      ed:'#0231', pr:'500'},
    {n:4, name:'Origami Crane',      sym:'g-crane',    g1:'#2E9C90', g2:'#1E4A52', r:'RARE',      ed:'#0188', pr:'450'},
    {n:5, name:'Clockwork Heart',    sym:'g-heart',    g1:'#A6763A', g2:'#443428', r:'EPIC',      ed:'#0056', pr:'300'},
    {n:6, name:'Aurora Jellyfish',   sym:'g-jelly',    g1:'#2EA69A', g2:'#164A48', r:'EPIC',      ed:'#0099', pr:'400'},
    {n:7, name:'Crystal Fox',        sym:'g-fox',      g1:'#C4468E', g2:'#4A2044', r:'LEGENDARY', ed:'#0012', pr:'1,200'},
    {n:8, name:'Comet Core',         sym:'g-comet',    g1:'#C99A3A', g2:'#3E3220', r:'RARE',      ed:'#0203', pr:'550'},
    {n:9, name:'Emerald Dragon Egg', sym:'g-egg',      g1:'#2E9C5A', g2:'#154A2E', r:'EPIC',      ed:'#0071', pr:'650'},
    {n:10,name:'Sunset Balloon',     sym:'g-balloon',  g1:'#E0774A', g2:'#5E2E32', r:'UNCOMMON',  ed:'#0310', pr:'150'},
    {n:11,name:'Retro Cassette',     sym:'g-cassette', g1:'#3E9A80', g2:'#1E4A40', r:'UNCOMMON',  ed:'#0288', pr:'120'},
    {n:12,name:'Ocean Pearl',        sym:'g-pearl',    g1:'#4C8DC4', g2:'#243E5E', r:'RARE',      ed:'#0155', pr:'400'}
  ];

  var BY_NAME = {}, BY_SYM = {};
  CATALOG.forEach(function (g) { BY_NAME[g.name.toLowerCase()] = g; BY_SYM[g.sym] = g; });

  function find(key) {
    if (!key) return null;
    return BY_SYM[key] || BY_NAME[String(key).toLowerCase()] || null;
  }

  // Inject the shared <defs> once per document.
  function injectDefs(doc) {
    doc = doc || document;
    if (doc.getElementById('loom-gifts-defs')) return;
    var host = doc.createElement('div');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = DEFS;
    (doc.body || doc.documentElement).insertBefore(host, (doc.body || doc.documentElement).firstChild);
  }

  // Raw animated object: an <svg> that <use>s a gift symbol.
  function svgHTML(sym, size) {
    size = size || 140;
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 200 200" style="display:block"><use href="#'+sym+'"/></svg>';
  }
  function el(sym, size) {
    injectDefs();
    var d = document.createElement('div');
    d.innerHTML = svgHTML(sym, size);
    return d.firstChild;
  }

  function chipHTML(r) {
    if (r === 'LEGENDARY') return '<span style="display:inline-block;padding:3px 9px;background:linear-gradient(135deg,#7B6CF6,#C86DD7);border-radius:999px;color:#fff;font-size:10px;font-weight:700;box-shadow:0 3px 10px rgba(150,90,220,0.45)">\u25c6 LEGENDARY</span>';
    return '<span style="display:inline-block;padding:3px 9px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.32);border-radius:999px;color:#fff;font-size:10px;font-weight:700">'+r+'</span>';
  }

  // Full collectible card: radial backdrop + drifting symbol pattern + rarity chip + edition #.
  function cardHTML(key, opts) {
    var g = find(key); if (!g) return '';
    opts = opts || {};
    var w = opts.width || 220, art = opts.artHeight || 150, sym = opts.symbolSize || 146;
    return '<div style="width:'+w+'px;font-family:'+FONT+';background:#FCFCFE;border-radius:20px;padding:12px;box-shadow:0 6px 22px rgba(30,30,50,0.07);border:1px solid #ECECF2">'
      + '<div style="position:relative;border-radius:15px;overflow:hidden;background:radial-gradient(120% 100% at 50% 18%,'+g.g1+','+g.g2+')">'
      + '<svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="none" style="position:absolute;inset:0;opacity:0.42"><rect width="200" height="150" fill="url(#giftPat)"/></svg>'
      + '<div style="position:absolute;top:10px;left:10px">'+chipHTML(g.r)+'</div>'
      + '<div style="position:absolute;top:10px;right:10px;color:rgba(255,255,255,0.72);font-size:10px;font-weight:600;font-family:monospace">'+g.ed+'</div>'
      + '<div style="position:relative;height:'+art+'px;display:flex;align-items:center;justify-content:center">'+svgHTML(g.sym, sym)+'</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 6px 4px"><span style="font-size:14px;font-weight:700;color:#1A1A22">'+String(g.n).padStart(2,'0')+' \u00b7 '+g.name+(g.r==='LEGENDARY'?' <span style="color:#C86DD7">\u25c6</span>':'')+'</span><span style="padding:3px 10px;background:#F0A93A;border-radius:999px;color:#fff;font-size:12px;font-weight:700">\u2605 '+g.pr+'</span></div>'
      + '</div>';
  }

  // Reduced-motion: freeze every SMIL loop on a clean glossy frame.
  function freezeIfReduced(doc) {
    doc = doc || document;
    try {
      if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(function () {
          doc.querySelectorAll('svg').forEach(function (s) {
            if (s.setCurrentTime) s.setCurrentTime(1.6);
            if (s.pauseAnimations) s.pauseAnimations();
          });
        });
      }
    } catch (e) {}
  }

  // Hydrate declarative placeholders.
  function hydrate(doc) {
    doc = doc || document;
    injectDefs(doc);
    doc.querySelectorAll('[data-loom-gift]').forEach(function (n) {
      var g = find(n.getAttribute('data-loom-gift'));
      if (g) n.innerHTML = svgHTML(g.sym, +n.getAttribute('data-size') || 140);
    });
    doc.querySelectorAll('[data-loom-card]').forEach(function (n) {
      n.innerHTML = cardHTML(n.getAttribute('data-loom-card'), {
        width: +n.getAttribute('data-width') || undefined
      });
    });
    freezeIfReduced(doc);
  }

  var API = { CATALOG: CATALOG, find: find, injectDefs: injectDefs,
              svgHTML: svgHTML, el: el, chipHTML: chipHTML, cardHTML: cardHTML,
              hydrate: hydrate, freezeIfReduced: freezeIfReduced, FONT: FONT };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.LoomGifts = API;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ hydrate(); });
    else hydrate();
  }
})(typeof window !== 'undefined' ? window : this);

