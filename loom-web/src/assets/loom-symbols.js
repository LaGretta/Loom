/*!
 * Loom Symbols — glossy 3D "hero object" library (v1)
 * Same technique as loom-gifts.js: inline SVG <symbol> defs + SMIL, zero network.
 *   window.LoomSym.injectDefs(document)
 *   window.LoomSym.svgHTML('s-coin', 120)   -> '<svg>…<use/></svg>' string
 * Symbol ids: s-coin s-gem s-gift s-rocket s-paint s-spectrum
 * Upper-left light, specular highlights, gradient volume, soft contact shadow,
 * crisp viewBox scaling, subtle idle shimmer. Freezes under prefers-reduced-motion.
 */
(function (root) {
  var DEFS = `<svg id="loom-symbols-defs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>

    <filter id="lsSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="lsSoft2" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="lsGlow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <linearGradient id="lsShimmer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="lsSpec" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.98"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>

    <!-- gold coin -->
    <radialGradient id="lsGoldFace" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="#FFF6D6"/><stop offset="0.38" stop-color="#F7CE63"/><stop offset="0.7" stop-color="#E0A237"/><stop offset="1" stop-color="#B4761C"/></radialGradient>
    <linearGradient id="lsGoldRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6CB54"/><stop offset="1" stop-color="#9A6415"/></linearGradient>
    <radialGradient id="lsStarG" cx="0.4" cy="0.32" r="0.8"><stop offset="0" stop-color="#FFFAE8"/><stop offset="0.55" stop-color="#FBDE86"/><stop offset="1" stop-color="#D8A034"/></radialGradient>
    <radialGradient id="lsGoldHalo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.5"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>

    <!-- gem -->
    <linearGradient id="lsGemLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCE0FF"/><stop offset="1" stop-color="#A99CFF"/></linearGradient>
    <linearGradient id="lsGemMid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8E7BF0"/><stop offset="1" stop-color="#5B6BE0"/></linearGradient>
    <linearGradient id="lsGemDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B4FC8"/><stop offset="1" stop-color="#2E3A9E"/></linearGradient>
    <linearGradient id="lsGemBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FA8FF"/><stop offset="1" stop-color="#3E5BD0"/></linearGradient>
    <radialGradient id="lsGemInner" cx="0.5" cy="0.42" r="0.55"><stop offset="0" stop-color="#F2ECFF" stop-opacity="0.95"/><stop offset="0.6" stop-color="#B9A8FF" stop-opacity="0.3"/><stop offset="1" stop-color="#B9A8FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="lsGemHalo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#9B8BFF" stop-opacity="0.55"/><stop offset="1" stop-color="#9B8BFF" stop-opacity="0"/></radialGradient>

    <!-- gift -->
    <linearGradient id="lsBoxG" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#3E3A5C"/><stop offset="0.5" stop-color="#2A2740"/><stop offset="1" stop-color="#1C1A30"/></linearGradient>
    <linearGradient id="lsBoxLid" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#514C74"/><stop offset="1" stop-color="#332F4E"/></linearGradient>
    <linearGradient id="lsRibbon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset="0.5" stop-color="#F5C24E"/><stop offset="1" stop-color="#D89A2E"/></linearGradient>

    <!-- rocket -->
    <linearGradient id="lsRoc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7FF"/><stop offset="0.5" stop-color="#C6D2EC"/><stop offset="1" stop-color="#8FA0C4"/></linearGradient>
    <linearGradient id="lsRocFin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A5B"/><stop offset="1" stop-color="#E4542E"/></linearGradient>
    <linearGradient id="lsFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset="0.5" stop-color="#FFB03A"/><stop offset="1" stop-color="#EC6470" stop-opacity="0.4"/></linearGradient>

    <!-- paint token -->
    <radialGradient id="lsPaintBase" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stop-color="#FCFCFE"/><stop offset="0.6" stop-color="#E4E4EC"/><stop offset="1" stop-color="#B6B6C4"/></radialGradient>

    <!-- spectrum orb -->
    <radialGradient id="lsSpecOrb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF6B9D"/><stop offset="0.22" stop-color="#FFA94D"/><stop offset="0.42" stop-color="#FFE24D"/><stop offset="0.6" stop-color="#5BE07A"/><stop offset="0.78" stop-color="#4DB8FF"/><stop offset="1" stop-color="#B06BFF"/></radialGradient>
    <linearGradient id="lsSpecSheen" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="lsClipCoin"><ellipse cx="100" cy="100" rx="66" ry="66"/></clipPath>
    <clipPath id="lsClipOrb"><circle cx="100" cy="100" r="60"/></clipPath>
    <clipPath id="lsClipGem"><path d="M62 74 L100 40 L138 74 L100 158 Z"/></clipPath>
    <radialGradient id="lsGemFire" cx="0.5" cy="0.42" r="0.55"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.3" stop-color="#DCE6FF"/><stop offset="0.7" stop-color="#8E7BF0" stop-opacity="0.5"/><stop offset="1" stop-color="#8E7BF0" stop-opacity="0"/></radialGradient>
    <linearGradient id="lsIdentity" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FB4FF"/><stop offset="0.5" stop-color="#4C8DF6"/><stop offset="1" stop-color="#2E5AC8"/></linearGradient>
    <linearGradient id="lsIdentityLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF2FF"/><stop offset="1" stop-color="#9EC0FF"/></linearGradient>
    <linearGradient id="lsBook" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#FF9A6B"/><stop offset="0.5" stop-color="#EC6470"/><stop offset="1" stop-color="#B83E58"/></linearGradient>
    <linearGradient id="lsBookLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0B8"/><stop offset="1" stop-color="#EC6470"/></linearGradient>
    <radialGradient id="lsGear" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="#F0F3F8"/><stop offset="0.45" stop-color="#C2CBDA"/><stop offset="0.78" stop-color="#8B97AC"/><stop offset="1" stop-color="#5C6678"/></radialGradient>
    <radialGradient id="lsGearHub" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#DDE3EE"/><stop offset="1" stop-color="#6E7A8E"/></radialGradient>

    <!-- ===== STAR COIN ===== -->
    <symbol id="s-coin" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="50" ry="10" fill="#4A3410" opacity="0.28" filter="url(#lsSoft2)"><animate attributeName="rx" values="50;44;50" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="98" r="82" fill="url(#lsGoldHalo)"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.4s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 4;0 -6;0 4" keyTimes="0;0.5;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <!-- 3D edge -->
        <ellipse cx="100" cy="106" rx="66" ry="66" fill="#8A5A16"/>
        <ellipse cx="100" cy="103" rx="66" ry="66" fill="#A6701E"/>
        <!-- face with subtle mint (fake spin sheen) -->
        <g><animateTransform attributeName="transform" type="scale" values="1 1;0.985 1;1 1" keyTimes="0;0.5;1" dur="6s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum" transform-origin="100 100"/>
          <ellipse cx="100" cy="100" rx="66" ry="66" fill="url(#lsGoldFace)"/>
          <ellipse cx="100" cy="100" rx="57" ry="57" fill="none" stroke="#C98A2A" stroke-width="3" opacity="0.6"/>
          <ellipse cx="100" cy="100" rx="57" ry="57" fill="none" stroke="#FFE9A8" stroke-width="1.4" opacity="0.55"/>
          <g clip-path="url(#lsClipCoin)">
            <!-- engraved star -->
            <path d="M100 58 L112 90 L146 90 L118 110 L129 143 L100 123 L71 143 L82 110 L54 90 L88 90 Z" fill="#B4791E" opacity="0.55" transform="translate(0 3)"/>
            <path d="M100 58 L112 90 L146 90 L118 110 L129 143 L100 123 L71 143 L82 110 L54 90 L88 90 Z" fill="url(#lsStarG)"/>
            <path d="M100 58 L112 90 L146 90 L118 110 L100 123 Z" fill="#fff" opacity="0.22"/>
            <!-- moving specular sweep -->
            <rect x="-60" y="20" width="46" height="170" fill="url(#lsShimmer)" transform="rotate(18 100 100)"><animate attributeName="x" values="-70;-70;230;230" keyTimes="0;0.55;0.82;1" dur="3.8s" repeatCount="indefinite"/></rect>
          </g>
          <!-- top-left specular -->
          <ellipse cx="74" cy="70" rx="24" ry="15" fill="url(#lsSpec)" transform="rotate(-32 74 70)"/>
          <circle cx="66" cy="62" r="5" fill="#fff"/>
        </g>
      </g>
      <g fill="#FFE9A8"><g transform="translate(150 52)"><path d="M0 -8 L1.8 -1.8 L8 0 L1.8 1.8 L0 8 L-1.8 1.8 L-8 0 L-1.8 -1.8 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite"/></path></g><g transform="translate(50 66)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="3.3s" begin="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3.3s" begin="1.1s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== PREMIUM GEM ===== -->
    <symbol id="s-gem" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="42" ry="9" fill="#1E1A44" opacity="0.3" filter="url(#lsSoft2)"><animate attributeName="rx" values="42;36;42" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="96" r="82" fill="url(#lsGemHalo)"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 5;0 -7;0 5" keyTimes="0;0.5;1" dur="4.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="96" r="70" fill="none" stroke="#B7A6FF" stroke-width="2.5"><animate attributeName="r" values="66;88;88" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" keyTimes="0;0.7;1" dur="3.4s" repeatCount="indefinite"/></circle>
        <!-- crown + pavilion facets -->
        <path d="M62 74 L100 40 L138 74 L100 158 Z" fill="url(#lsGemMid)"/>
        <path d="M62 74 L100 40 L100 84 Z" fill="url(#lsGemLit)"/>
        <path d="M100 40 L138 74 L100 84 Z" fill="url(#lsGemBlue)"/>
        <path d="M62 74 L100 84 L100 158 Z" fill="url(#lsGemDark)"/>
        <path d="M138 74 L100 84 L100 158 Z" fill="url(#lsGemMid)" opacity="0.9"/>
        <path d="M62 74 L138 74 L100 84 Z" fill="url(#lsGemBlue)" opacity="0.7"/>
        <!-- table facet edges -->
        <path d="M62 74 L138 74 M100 40 L100 84 M62 74 L100 84 L138 74 M100 84 L100 158" stroke="#fff" stroke-opacity="0.4" stroke-width="1.4" fill="none"/>
        <path d="M78 74 L88 84 L84 120 M122 74 L112 84 L116 120" stroke="#fff" stroke-opacity="0.22" stroke-width="1.1" fill="none"/>
        <ellipse cx="100" cy="90" rx="20" ry="26" fill="url(#lsGemInner)"><animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.2s" repeatCount="indefinite"/></ellipse>
        <g clip-path="url(#lsClipGem)">
          <ellipse cx="100" cy="96" rx="30" ry="40" fill="url(#lsGemFire)"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.6s" repeatCount="indefinite"/></ellipse>
          <g transform="translate(100 96)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite" additive="sum"/><path d="M0 -46 L6 0 L0 46 L-6 0 Z" fill="#fff" opacity="0.28"/><path d="M-46 0 L0 5 L46 0 L0 -5 Z" fill="#CDD8FF" opacity="0.16"/><path d="M-32 -32 L4 0 L32 32 L-4 0 Z" fill="#B9A8FF" opacity="0.2"/></g>
          <rect x="-40" y="20" width="22" height="150" fill="url(#lsShimmer)" transform="rotate(16 100 96)"><animate attributeName="x" values="-50;-50;220;220" keyTimes="0;0.5;0.8;1" dur="3.4s" repeatCount="indefinite"/></rect>
        </g>
        <path d="M62 74 L100 84 L138 74" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.6"/>
        <path d="M70 64 L92 58" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <circle cx="80" cy="62" r="3.4" fill="#fff"/>
      </g>
      <g fill="#EAE4FF"><g transform="translate(146 52)"><path d="M0 -8 L1.8 -1.8 L8 0 L1.8 1.8 L0 8 L-1.8 1.8 L-8 0 L-1.8 -1.8 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.6s" repeatCount="indefinite"/></path></g><g transform="translate(52 58)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="3.2s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3.2s" begin="1s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== GIFT BOX ===== -->
    <symbol id="s-gift" viewBox="0 0 200 200">
      <ellipse cx="100" cy="176" rx="52" ry="9" fill="#15132A" opacity="0.28" filter="url(#lsSoft2)"><animate attributeName="rx" values="52;46;52" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="100" cy="100" r="80" fill="#8A6BF2" opacity="0.1" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 4;0 -6;0 4" keyTimes="0;0.5;1" dur="4.6s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <!-- box body -->
        <path d="M52 92 L100 104 L100 168 L52 156 Z" fill="url(#lsBoxG)"/>
        <path d="M148 92 L100 104 L100 168 L148 156 Z" fill="#242138"/>
        <path d="M52 92 L100 80 L148 92 L100 104 Z" fill="url(#lsBoxLid)"/>
        <!-- lid overhang -->
        <path d="M46 84 L100 70 L154 84 L100 98 Z" fill="url(#lsBoxLid)"/>
        <path d="M46 84 L100 98 L100 112 L46 100 Z" fill="#3A3658"/>
        <path d="M154 84 L100 98 L100 112 L154 100 Z" fill="#2A2742"/>
        <!-- vertical ribbon -->
        <path d="M90 72 L110 72 L110 166 L100 168 L90 166 Z" fill="url(#lsRibbon)" opacity="0.5"/>
        <path d="M92 98 L108 98 L108 166 L100 168 L92 166 Z" fill="url(#lsRibbon)"/>
        <path d="M92 84 L108 84 L108 98 L92 98 Z" fill="#FFE9A8"/>
        <!-- bow -->
        <path d="M100 74 C 78 50, 58 62, 74 76 C 82 84, 96 80, 100 74 Z" fill="url(#lsRibbon)"/>
        <path d="M100 74 C 122 50, 142 62, 126 76 C 118 84, 104 80, 100 74 Z" fill="url(#lsRibbon)"/>
        <path d="M100 74 C 92 68, 90 62, 74 76 M100 74 C 108 68, 110 62, 126 76" stroke="#B87F1E" stroke-width="1.4" fill="none" opacity="0.6"/>
        <circle cx="100" cy="76" r="7" fill="#FFE9A8"/><circle cx="97" cy="73" r="2.4" fill="#fff"/>
        <!-- specular on lid -->
        <path d="M60 86 L100 76 L120 80" stroke="#fff" stroke-opacity="0.3" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M56 96 L96 108 L96 150" stroke="#fff" stroke-opacity="0.12" stroke-width="2" fill="none"/>
      </g>
      <g fill="#FFE9A8"><g transform="translate(150 66)"><path d="M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== ROCKET (Faster) ===== -->
    <symbol id="s-rocket" viewBox="0 0 200 200">
      <ellipse cx="100" cy="176" rx="30" ry="7" fill="#1A2036" opacity="0.24" filter="url(#lsSoft2)"/>
      <ellipse cx="100" cy="162" rx="20" ry="22" fill="#FFB03A" opacity="0.35" filter="url(#lsSoft2)"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="0.6s" repeatCount="indefinite"/></ellipse>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -5;0 3" keyTimes="0;0.5;1" dur="3.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M84 132 L64 150 L78 146 L84 150 Z" fill="url(#lsRocFin)"/>
        <path d="M126 132 L146 150 L132 146 L126 150 Z" fill="url(#lsRocFin)"/>
        <path d="M126 132 L146 150 L138 148 Z" fill="#fff" opacity="0.25"/>
        <path d="M84 150 L74 132 C 68 96, 82 56, 100 34 C 118 56, 132 96, 126 132 L116 150 Z" fill="url(#lsRoc)"/>
        <path d="M100 34 C 92 46, 84 72, 84 108 L100 116 Z" fill="#fff" opacity="0.4"/>
        <path d="M100 34 C 108 46, 116 72, 116 116 L100 116 Z" fill="#7E8CA8" opacity="0.3"/>
        <path d="M84 150 L116 150 L112 140 L88 140 Z" fill="#8792AC"/>
        <circle cx="100" cy="92" r="13" fill="#213158"/><circle cx="100" cy="92" r="13" fill="none" stroke="#DCE6F8" stroke-width="3"/>
        <path d="M92 88 a 10 10 0 0 1 10 -6" fill="none" stroke="#BFE0FF" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        <circle cx="95" cy="87" r="3" fill="#fff"/>
        <path d="M96 46 C 92 56, 90 72, 92 96" stroke="#fff" stroke-width="2.6" fill="none" opacity="0.7" stroke-linecap="round"/>
        <path d="M90 150 L110 150 L104 172 L96 172 Z" fill="url(#lsFlame)"><animateTransform attributeName="transform" type="scale" values="1 0.7;1 1.15;1 0.8;1 1.05;1 0.7" dur="0.5s" repeatCount="indefinite" additive="sum" transform-origin="100 150"/></path>
        <path d="M95 150 L105 150 L101 164 L99 164 Z" fill="#FFF3C8"><animate attributeName="opacity" values="0.7;1;0.7" dur="0.4s" repeatCount="indefinite"/></path>
      </g>
    </symbol>

    <!-- ===== PAINT TOKEN (Wallpapers) ===== -->
    <symbol id="s-paint" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="44" ry="8" fill="#1A1A22" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -5;0 3" keyTimes="0;0.5;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <ellipse cx="100" cy="106" rx="58" ry="58" fill="#9A9AAA"/>
        <circle cx="100" cy="100" r="58" fill="url(#lsPaintBase)"/>
        <circle cx="100" cy="100" r="58" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="1.4"/>
        <!-- paint dabs -->
        <circle cx="78" cy="80" r="12" fill="#EC6470"/><circle cx="74" cy="76" r="3.4" fill="#fff" opacity="0.7"/>
        <circle cx="118" cy="80" r="12" fill="#4C8DF6"/><circle cx="114" cy="76" r="3.4" fill="#fff" opacity="0.7"/>
        <circle cx="122" cy="112" r="12" fill="#46C08A"/><circle cx="118" cy="108" r="3.2" fill="#fff" opacity="0.7"/>
        <circle cx="80" cy="120" r="12" fill="#F0A93A"/><circle cx="76" cy="116" r="3.2" fill="#fff" opacity="0.7"/>
        <circle cx="100" cy="100" r="16" fill="#8E7BF0"/><circle cx="95" cy="95" r="4.4" fill="#fff" opacity="0.75"/>
        <ellipse cx="80" cy="74" rx="20" ry="12" fill="#fff" opacity="0.18" transform="rotate(-28 80 74)"/>
      </g>
    </symbol>

    <!-- ===== SPECTRUM ORB (Gradient name) ===== -->
    <symbol id="s-spectrum" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="42" ry="8" fill="#1A1A22" opacity="0.24" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="100" r="78" fill="url(#lsSpecOrb)" opacity="0.14" filter="url(#lsSoft2)"><animate attributeName="opacity" values="0.1;0.24;0.1" dur="3.4s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 4;0 -5;0 4" keyTimes="0;0.5;1" dur="4.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="100" r="60" fill="url(#lsSpecOrb)"/>
        <g clip-path="url(#lsClipOrb)"><g transform="translate(100 100)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" additive="sum"/><ellipse cx="0" cy="0" rx="60" ry="24" fill="#fff" opacity="0.14"/><ellipse cx="0" cy="0" rx="24" ry="60" fill="#fff" opacity="0.1"/></g>
          <rect x="-40" y="20" width="30" height="160" fill="url(#lsShimmer)" transform="rotate(18 100 100)"><animate attributeName="x" values="-50;-50;220;220" keyTimes="0;0.5;0.8;1" dur="3.6s" repeatCount="indefinite"/></rect>
        </g>
        <path d="M60 78 A 60 60 0 0 1 150 70" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="78" cy="72" rx="22" ry="13" fill="url(#lsSpecSheen)" transform="rotate(-30 78 72)"/>
        <circle cx="70" cy="66" r="5" fill="#fff"/>
      </g>
    </symbol>

    <!-- ===== IDENTITY (My Profile) — crystal person medallion ===== -->
    <symbol id="s-person" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="40" ry="8" fill="#152036" opacity="0.24" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="98" r="78" fill="#4C8DF6" opacity="0.12" filter="url(#lsSoft2)"><animate attributeName="opacity" values="0.08;0.2;0.08" dur="3.4s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -5;0 3" keyTimes="0;0.5;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="102" r="58" fill="#2E5AC8"/>
        <circle cx="100" cy="98" r="58" fill="url(#lsIdentity)"/>
        <circle cx="100" cy="98" r="58" fill="none" stroke="#EAF2FF" stroke-opacity="0.55" stroke-width="1.6"/>
        <circle cx="100" cy="98" r="49" fill="none" stroke="#1E3E9E" stroke-opacity="0.4" stroke-width="2"/>
        <circle cx="100" cy="84" r="17" fill="url(#lsIdentityLit)"/>
        <circle cx="100" cy="84" r="17" fill="#fff" opacity="0.12"/>
        <path d="M70 132 C 72 108, 128 108, 130 132 C 120 140, 80 140, 70 132 Z" fill="url(#lsIdentityLit)"/>
        <ellipse cx="90" cy="76" rx="6" ry="4" fill="#fff" opacity="0.75" transform="rotate(-24 90 76)"/>
        <g clip-path="url(#lsClipOrb)"><rect x="-40" y="20" width="24" height="160" fill="url(#lsShimmer)" transform="rotate(18 100 98)"><animate attributeName="x" values="-50;-50;220;220" keyTimes="0;0.5;0.8;1" dur="3.8s" repeatCount="indefinite"/></rect></g>
      </g>
      <g fill="#EAF2FF"><g transform="translate(148 56)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <!-- ===== BOOKMARK (Saved) — glossy 3D ribbon ===== -->
    <symbol id="s-bookmark" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="30" ry="7" fill="#3A1420" opacity="0.24" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="96" r="70" fill="#EC6470" opacity="0.12" filter="url(#lsSoft2)"><animate attributeName="opacity" values="0.08;0.2;0.08" dur="3.2s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -5;0 3" keyTimes="0;0.5;1" dur="4.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M64 40 L136 40 L136 160 L100 130 L64 160 Z" fill="#B83E58"/>
        <path d="M60 36 L132 36 L132 156 L96 126 L60 156 Z" fill="url(#lsBook)"/>
        <path d="M60 36 L132 36 L132 156 L96 126 L60 156 Z" fill="none" stroke="#FFD0B8" stroke-opacity="0.5" stroke-width="1.6"/>
        <path d="M60 36 L96 36 L96 126 L60 156 Z" fill="#fff" opacity="0.16"/>
        <path d="M70 46 L82 46" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <ellipse cx="74" cy="58" rx="8" ry="18" fill="#fff" opacity="0.22" transform="rotate(-6 74 58)"/>
        <g clip-path="url(#lsClipOrb)"><rect x="-40" y="0" width="20" height="200" fill="url(#lsShimmer)" transform="rotate(14 100 96)"><animate attributeName="x" values="-50;-50;220;220" keyTimes="0;0.5;0.82;1" dur="3.6s" repeatCount="indefinite"/></rect></g>
      </g>
    </symbol>

    <!-- ===== GEAR (Settings) — brushed steel cog ===== -->
    <symbol id="s-gear" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="40" ry="8" fill="#1A1F2A" opacity="0.24" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="98" r="74" fill="#8B97AC" opacity="0.12" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -5;0 3" keyTimes="0;0.5;1" dur="4.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <g transform="translate(100 100)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" additive="sum"/>
          <g fill="#5C6678"><g id="lsGearTeeth"><rect x="-9" y="-64" width="18" height="24" rx="4"/><rect x="-9" y="40" width="18" height="24" rx="4"/><rect x="-64" y="-9" width="24" height="18" rx="4"/><rect x="40" y="-9" width="24" height="18" rx="4"/></g><g transform="rotate(45)"><rect x="-9" y="-64" width="18" height="24" rx="4"/><rect x="-9" y="40" width="18" height="24" rx="4"/><rect x="-64" y="-9" width="24" height="18" rx="4"/><rect x="40" y="-9" width="24" height="18" rx="4"/></g></g>
          <g fill="url(#lsGear)"><g><rect x="-9" y="-62" width="18" height="22" rx="4"/><rect x="-9" y="40" width="18" height="22" rx="4"/><rect x="-62" y="-9" width="22" height="18" rx="4"/><rect x="40" y="-9" width="22" height="18" rx="4"/></g><g transform="rotate(45)"><rect x="-9" y="-62" width="18" height="22" rx="4"/><rect x="-9" y="40" width="18" height="22" rx="4"/><rect x="-62" y="-9" width="22" height="18" rx="4"/><rect x="40" y="-9" width="22" height="18" rx="4"/></g></g>
          <circle r="46" fill="url(#lsGear)"/>
          <circle r="46" fill="none" stroke="#EFF3F8" stroke-opacity="0.4" stroke-width="1.6"/>
          <circle r="22" fill="url(#lsGearHub)"/>
          <circle r="22" fill="none" stroke="#4C5568" stroke-width="2"/>
          <circle r="10" fill="#48505F"/>
          <ellipse cx="-16" cy="-18" rx="14" ry="9" fill="#fff" opacity="0.28" transform="rotate(-30 -16 -18)"/>
        </g>
        <g clip-path="url(#lsClipOrb)"><rect x="-40" y="20" width="22" height="160" fill="url(#lsShimmer)" transform="rotate(18 100 100)"><animate attributeName="x" values="-50;-50;220;220" keyTimes="0;0.5;0.82;1" dur="4s" repeatCount="indefinite"/></rect></g>
      </g>
    </symbol>

    <!-- ===== SETTINGS OBJECTS ===== -->
    <radialGradient id="lsBell" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stop-color="#FFE9A8"/><stop offset="0.5" stop-color="#F0A93A"/><stop offset="1" stop-color="#B4761C"/></radialGradient>
    <linearGradient id="lsLock" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#9AE6C0"/><stop offset="0.5" stop-color="#46C08A"/><stop offset="1" stop-color="#2E8A62"/></linearGradient>
    <linearGradient id="lsDrive" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#EAF0FA"/><stop offset="0.5" stop-color="#B6C2D8"/><stop offset="1" stop-color="#7A889E"/></linearGradient>
    <radialGradient id="lsGlobe" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="#9FD0FF"/><stop offset="0.5" stop-color="#4C8DF6"/><stop offset="1" stop-color="#2E5AC8"/></radialGradient>
    <radialGradient id="lsRing" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF9A8B"/><stop offset="1" stop-color="#EC6470"/></radialGradient>
    <radialGradient id="lsSun" cx="0.42" cy="0.36" r="0.7"><stop offset="0" stop-color="#FFF6D0"/><stop offset="0.55" stop-color="#F7C94E"/><stop offset="1" stop-color="#E0921C"/></radialGradient>
    <radialGradient id="lsMoon" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="#EEF2FF"/><stop offset="0.55" stop-color="#B9C4E6"/><stop offset="1" stop-color="#7C88AE"/></radialGradient>
    <linearGradient id="lsFlask" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B49AF0"/><stop offset="1" stop-color="#6C5CE7"/></linearGradient>

    <symbol id="s-bell" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="34" ry="7" fill="#4A3410" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-7 100 44;7 100 44;-7 100 44" dur="2.6s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
        <rect x="94" y="32" width="12" height="12" rx="6" fill="#B4761C"/>
        <path d="M62 132 C 60 96, 68 62, 100 58 C 132 62, 140 96, 138 132 Z" fill="url(#lsBell)"/>
        <path d="M62 132 L138 132 L142 144 L58 144 Z" fill="#C98A2A"/>
        <path d="M72 70 C 78 60, 90 58, 100 58" stroke="#FFF3C8" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
        <ellipse cx="82" cy="86" rx="9" ry="16" fill="#fff" opacity="0.22" transform="rotate(-12 82 86)"/>
      </g>
      <ellipse cx="100" cy="152" rx="9" ry="9" fill="#D9A24B"/>
    </symbol>

    <symbol id="s-lock" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="36" ry="7" fill="#0E3A22" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M74 88 L74 66 A 26 26 0 0 1 126 66 L126 88" fill="none" stroke="#7A889E" stroke-width="13"/>
        <path d="M74 88 L74 66 A 26 26 0 0 1 126 66 L126 88" fill="none" stroke="url(#lsDrive)" stroke-width="9"/>
        <rect x="58" y="86" width="84" height="66" rx="16" fill="url(#lsLock)"/>
        <rect x="58" y="86" width="84" height="66" rx="16" fill="none" stroke="#CFF3E0" stroke-opacity="0.5" stroke-width="1.6"/>
        <circle cx="100" cy="114" r="10" fill="#1E5E42"/><rect x="96" y="118" width="8" height="18" rx="4" fill="#1E5E42"/>
        <ellipse cx="76" cy="104" rx="8" ry="16" fill="#fff" opacity="0.2"/>
      </g>
    </symbol>

    <symbol id="s-drive" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="40" ry="7" fill="#1A1F2A" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4.2s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <rect x="46" y="70" width="108" height="34" rx="10" fill="url(#lsDrive)"/>
        <rect x="46" y="100" width="108" height="34" rx="10" fill="#9AA6BC"/>
        <rect x="46" y="70" width="108" height="34" rx="10" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="1.4"/>
        <circle cx="132" cy="87" r="5" fill="#46C08A"><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/></circle>
        <circle cx="132" cy="117" r="5" fill="#4C8DF6"/>
        <rect x="58" y="82" width="30" height="5" rx="2.5" fill="#7A889E" opacity="0.6"/>
        <rect x="58" y="112" width="30" height="5" rx="2.5" fill="#7A889E" opacity="0.6"/>
        <ellipse cx="70" cy="78" rx="18" ry="4" fill="#fff" opacity="0.3"/>
      </g>
    </symbol>

    <symbol id="s-globe" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="40" ry="7" fill="#152036" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="100" r="56" fill="url(#lsGlobe)"/>
        <g clip-path="url(#lsClipOrb)"><g transform="translate(100 100)"><animateTransform attributeName="transform" type="translate" values="0 0;-30 0;0 0" dur="9s" repeatCount="indefinite" additive="sum"/>
          <path d="M-70 -20 Q -30 -34 10 -22 Q 40 -14 70 -26" stroke="#EAF2FF" stroke-opacity="0.5" stroke-width="2" fill="none"/>
          <ellipse cx="-24" cy="-6" rx="16" ry="12" fill="#8FE0B4" opacity="0.85"/><ellipse cx="20" cy="16" rx="20" ry="14" fill="#8FE0B4" opacity="0.8"/><ellipse cx="54" cy="-14" rx="12" ry="9" fill="#8FE0B4" opacity="0.8"/>
        </g>
          <ellipse cx="100" cy="100" rx="56" ry="56" fill="none" stroke="#DCE8FF" stroke-opacity="0.3" stroke-width="1.4"/>
          <path d="M100 44 L100 156 M56 78 Q100 92 144 78 M56 122 Q100 108 144 122" stroke="#EAF2FF" stroke-opacity="0.35" stroke-width="1.4" fill="none"/>
        </g>
        <ellipse cx="80" cy="76" rx="16" ry="10" fill="#fff" opacity="0.28" transform="rotate(-26 80 76)"/>
      </g>
    </symbol>

    <symbol id="s-help" viewBox="0 0 200 200">
      <ellipse cx="100" cy="170" rx="38" ry="7" fill="#3A1420" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 100 100;8 100 100;0 100 100;-8 100 100;0 100 100" dur="6s" repeatCount="indefinite"/>
        <circle cx="100" cy="100" r="56" fill="url(#lsRing)"/>
        <circle cx="100" cy="100" r="56" fill="none" stroke="#FFC9C2" stroke-opacity="0.5" stroke-width="1.6"/>
        <g fill="#fff"><circle cx="100" cy="56" r="9"/><circle cx="100" cy="144" r="9"/><circle cx="56" cy="100" r="9"/><circle cx="144" cy="100" r="9"/><circle cx="70" cy="70" r="7"/><circle cx="130" cy="70" r="7"/><circle cx="70" cy="130" r="7"/><circle cx="130" cy="130" r="7"/></g>
        <circle cx="100" cy="100" r="26" fill="#FCFCFE"/>
        <circle cx="100" cy="100" r="26" fill="none" stroke="#EC6470" stroke-width="4"/>
        <ellipse cx="86" cy="82" rx="12" ry="7" fill="#fff" opacity="0.4" transform="rotate(-24 86 82)"/>
      </g>
    </symbol>

    <symbol id="s-sun" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="34" ry="7" fill="#4A3410" opacity="0.2" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="96" r="70" fill="#FFE9A8" opacity="0.3" filter="url(#lsSoft2)"><animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/></circle>
      <g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="26s" repeatCount="indefinite"/>
        <g stroke="#F5B14C" stroke-width="7" stroke-linecap="round"><path d="M100 26 L100 42"/><path d="M100 150 L100 166"/><path d="M26 96 L42 96"/><path d="M150 96 L166 96"/><path d="M48 44 L59 55"/><path d="M141 44 L130 55"/><path d="M48 148 L59 137"/><path d="M141 148 L130 137"/></g>
      </g>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -3;0 3" keyTimes="0;0.5;1" dur="3.4s" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="96" r="34" fill="url(#lsSun)"/>
        <ellipse cx="88" cy="84" rx="12" ry="8" fill="#fff" opacity="0.4" transform="rotate(-26 88 84)"/>
      </g>
    </symbol>

    <symbol id="s-moon" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="34" ry="7" fill="#0F1220" opacity="0.24" filter="url(#lsSoft2)"/>
      <circle cx="100" cy="96" r="66" fill="#B9C4E6" opacity="0.18" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="96" r="46" fill="url(#lsMoon)"/>
        <circle cx="118" cy="82" r="46" fill="#0F1220"/>
        <circle cx="82" cy="88" r="7" fill="#9AA6C4" opacity="0.6"/><circle cx="72" cy="108" r="5" fill="#9AA6C4" opacity="0.5"/><circle cx="92" cy="116" r="4" fill="#9AA6C4" opacity="0.5"/>
        <path d="M70 74 A 46 46 0 0 0 66 110" stroke="#fff" stroke-opacity="0.4" stroke-width="3" fill="none"/>
      </g>
      <g fill="#EEF2FF"><g transform="translate(146 52)"><path d="M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <symbol id="s-flask" viewBox="0 0 200 200">
      <ellipse cx="100" cy="172" rx="34" ry="7" fill="#1E1A44" opacity="0.24" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <path d="M86 44 L114 44 L114 80 L140 140 A 12 12 0 0 1 129 158 L71 158 A 12 12 0 0 1 60 140 L86 80 Z" fill="#EAEAF4" opacity="0.5"/>
        <path d="M86 44 L114 44 L114 80 L140 140 A 12 12 0 0 1 129 158 L71 158 A 12 12 0 0 1 60 140 L86 80 Z" fill="none" stroke="#C6C2E0" stroke-width="3"/>
        <path d="M74 118 L126 118 L140 140 A 12 12 0 0 1 129 158 L71 158 A 12 12 0 0 1 60 140 Z" fill="url(#lsFlask)"/>
        <rect x="82" y="38" width="36" height="10" rx="5" fill="#8B7CF6"/>
        <circle cx="88" cy="138" r="4" fill="#fff" opacity="0.7"><animate attributeName="cy" values="150;126" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="2.4s" repeatCount="indefinite"/></circle>
        <circle cx="110" cy="140" r="3" fill="#fff" opacity="0.7"><animate attributeName="cy" values="152;128" dur="3s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="3s" begin="0.8s" repeatCount="indefinite"/></circle>
        <path d="M92 96 L108 96" stroke="#fff" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>
      </g>
    </symbol>

    <!-- ===== ATTACH / ACTION OBJECTS ===== -->
    <linearGradient id="lsCam" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#5B6472"/><stop offset="0.5" stop-color="#3A414E"/><stop offset="1" stop-color="#242932"/></linearGradient>
    <radialGradient id="lsLens" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#8FB4FF"/><stop offset="0.5" stop-color="#3E5AC8"/><stop offset="1" stop-color="#151A2E"/></radialGradient>
    <linearGradient id="lsPhoto1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FD0FF"/><stop offset="1" stop-color="#4C8DF6"/></linearGradient>
    <linearGradient id="lsPhoto2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD79A"/><stop offset="1" stop-color="#F0A93A"/></linearGradient>
    <linearGradient id="lsFile" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D6DCE8"/></linearGradient>
    <linearGradient id="lsCal" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#B49AF0"/><stop offset="1" stop-color="#6C5CE7"/></linearGradient>
    <linearGradient id="lsPin" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#FF9A8B"/><stop offset="0.5" stop-color="#EC6470"/><stop offset="1" stop-color="#B83E58"/></linearGradient>
    <radialGradient id="lsDisc" cx="0.4" cy="0.34" r="0.75"><stop offset="0" stop-color="#F7A6D0"/><stop offset="0.5" stop-color="#B06BFF"/><stop offset="1" stop-color="#5B3AC8"/></radialGradient>
    <linearGradient id="lsBubble" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#8FE0B4"/><stop offset="0.5" stop-color="#46C08A"/><stop offset="1" stop-color="#2E8A62"/></linearGradient>
    <linearGradient id="lsPhone" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#9FE6BE"/><stop offset="0.5" stop-color="#46C08A"/><stop offset="1" stop-color="#2E7A5A"/></linearGradient>
    <linearGradient id="lsVid" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#9FB0D0"/><stop offset="0.5" stop-color="#5B6580"/><stop offset="1" stop-color="#333A4C"/></linearGradient>

    <symbol id="s-camera" viewBox="0 0 200 200">
      <ellipse cx="100" cy="164" rx="46" ry="8" fill="#151A22" opacity="0.24" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <path d="M70 62 L84 46 L116 46 L130 62 Z" fill="#3A414E"/>
        <rect x="40" y="60" width="120" height="86" rx="18" fill="url(#lsCam)"/>
        <rect x="40" y="60" width="120" height="86" rx="18" fill="none" stroke="#7C8698" stroke-opacity="0.5" stroke-width="1.6"/>
        <circle cx="100" cy="104" r="30" fill="#1A1F2A"/><circle cx="100" cy="104" r="26" fill="url(#lsLens)"/>
        <circle cx="100" cy="104" r="26" fill="none" stroke="#8FB4FF" stroke-opacity="0.4" stroke-width="2"/>
        <circle cx="91" cy="95" r="7" fill="#EAF2FF" opacity="0.85"/>
        <circle cx="142" cy="78" r="5" fill="#FFD79A"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>
        <rect x="52" y="74" width="30" height="8" rx="4" fill="#fff" opacity="0.18"/>
      </g>
    </symbol>

    <symbol id="s-photos" viewBox="0 0 200 200">
      <ellipse cx="100" cy="166" rx="44" ry="8" fill="#152036" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4.2s" repeatCount="indefinite" additive="sum"/>
        <rect x="52" y="44" width="92" height="92" rx="14" fill="url(#lsPhoto2)" transform="rotate(-9 98 90)"/>
        <rect x="56" y="52" width="92" height="92" rx="14" fill="url(#lsFile)"/>
        <rect x="56" y="52" width="92" height="92" rx="14" fill="url(#lsPhoto1)"/>
        <rect x="56" y="52" width="92" height="92" rx="14" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="1.6"/>
        <circle cx="82" cy="80" r="10" fill="#FFE9A8"/>
        <path d="M60 132 L88 104 L108 122 L124 108 L144 128 L144 144 L56 144 Z" fill="#2E5AC8" opacity="0.75"/>
        <path d="M60 60 L100 60" stroke="#fff" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
      </g>
    </symbol>

    <symbol id="s-file" viewBox="0 0 200 200">
      <ellipse cx="100" cy="168" rx="38" ry="7" fill="#1A1F2A" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <path d="M62 40 L118 40 L142 64 L142 156 A 6 6 0 0 1 136 162 L62 162 A 6 6 0 0 1 56 156 L56 46 A 6 6 0 0 1 62 40 Z" fill="url(#lsFile)"/>
        <path d="M62 40 L118 40 L142 64 L142 156 A 6 6 0 0 1 136 162 L62 162 A 6 6 0 0 1 56 156 L56 46 A 6 6 0 0 1 62 40 Z" fill="none" stroke="#C2CBDA" stroke-width="1.6"/>
        <path d="M118 40 L118 64 L142 64 Z" fill="#B6C2D8"/>
        <g stroke="#8B97AC" stroke-width="5" stroke-linecap="round"><path d="M72 92 L126 92"/><path d="M72 108 L126 108"/><path d="M72 124 L104 124"/></g>
        <rect x="60" y="48" width="30" height="6" rx="3" fill="#fff" opacity="0.5"/>
      </g>
    </symbol>

    <symbol id="s-calendar" viewBox="0 0 200 200">
      <ellipse cx="100" cy="166" rx="42" ry="8" fill="#1E1A44" opacity="0.24" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4.2s" repeatCount="indefinite" additive="sum"/>
        <rect x="46" y="52" width="108" height="98" rx="16" fill="url(#lsCal)"/>
        <rect x="46" y="52" width="108" height="30" rx="16" fill="#8B7CF6"/>
        <rect x="46" y="78" width="108" height="72" fill="#F4F1FF"/>
        <rect x="46" y="52" width="108" height="98" rx="16" fill="none" stroke="#B9ADF7" stroke-width="1.6"/>
        <rect x="68" y="42" width="10" height="22" rx="5" fill="#5A4BD4"/><rect x="122" y="42" width="10" height="22" rx="5" fill="#5A4BD4"/>
        <g fill="#B9ADF7"><rect x="60" y="94" width="14" height="12" rx="3"/><rect x="82" y="94" width="14" height="12" rx="3"/><rect x="104" y="94" width="14" height="12" rx="3"/><rect x="126" y="94" width="14" height="12" rx="3"/><rect x="60" y="114" width="14" height="12" rx="3"/></g>
        <rect x="82" y="114" width="14" height="12" rx="3" fill="#6C5CE7"/>
        <rect x="58" y="60" width="30" height="6" rx="3" fill="#fff" opacity="0.4"/>
      </g>
    </symbol>

    <symbol id="s-pin" viewBox="0 0 200 200">
      <ellipse cx="100" cy="168" rx="24" ry="6" fill="#3A1420" opacity="0.3" filter="url(#lsSoft2)"><animate attributeName="rx" values="24;18;24" dur="3.4s" repeatCount="indefinite"/></ellipse>
      <g><animateTransform attributeName="transform" type="translate" values="0 4;0 -5;0 4" keyTimes="0;0.5;1" dur="3.4s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" additive="sum"/>
        <path d="M100 40 C 128 40, 148 60, 148 88 C 148 120, 112 148, 100 160 C 88 148, 52 120, 52 88 C 52 60, 72 40, 100 40 Z" fill="url(#lsPin)"/>
        <path d="M100 40 C 128 40, 148 60, 148 88 C 148 120, 112 148, 100 160 C 88 148, 52 120, 52 88 C 52 60, 72 40, 100 40 Z" fill="none" stroke="#FFC9C2" stroke-opacity="0.5" stroke-width="1.6"/>
        <circle cx="100" cy="86" r="20" fill="#3A1420"/><circle cx="100" cy="86" r="20" fill="url(#lsFile)" opacity="0.95"/>
        <ellipse cx="88" cy="66" rx="12" ry="8" fill="#fff" opacity="0.3" transform="rotate(-26 88 66)"/>
      </g>
    </symbol>

    <symbol id="s-music" viewBox="0 0 200 200">
      <ellipse cx="100" cy="164" rx="44" ry="8" fill="#2A1A44" opacity="0.24" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <circle cx="100" cy="100" r="56" fill="#241A3A"/>
        <g transform="translate(100 100)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" additive="sum"/><g transform="translate(-100 -100)"><circle cx="100" cy="100" r="56" fill="url(#lsDisc)" opacity="0.9"/><circle cx="100" cy="100" r="56" fill="none" stroke="#3A2A5E" stroke-width="1.5"/><circle cx="100" cy="100" r="42" fill="none" stroke="#fff" stroke-opacity="0.14" stroke-width="1"/><circle cx="100" cy="100" r="32" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1"/><circle cx="100" cy="100" r="16" fill="#F4F1FF"/><circle cx="100" cy="100" r="5" fill="#241A3A"/><path d="M62 74 A 56 56 0 0 1 120 52" stroke="#fff" stroke-opacity="0.4" stroke-width="4" fill="none" stroke-linecap="round"/></g></g>
      </g>
      <g fill="#B06BFF"><g transform="translate(150 54)"><path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"><animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.6s" repeatCount="indefinite"/></path></g></g>
    </symbol>

    <symbol id="s-bubble" viewBox="0 0 200 200">
      <ellipse cx="100" cy="164" rx="42" ry="8" fill="#0E3A28" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite" additive="sum"/>
        <path d="M46 56 L154 56 A 16 16 0 0 1 170 72 L170 122 A 16 16 0 0 1 154 138 L96 138 L70 158 L74 138 L46 138 A 16 16 0 0 1 30 122 L30 72 A 16 16 0 0 1 46 56 Z" fill="url(#lsBubble)"/>
        <path d="M46 56 L154 56 A 16 16 0 0 1 170 72 L170 122 A 16 16 0 0 1 154 138 L96 138 L70 158 L74 138 L46 138 A 16 16 0 0 1 30 122 L30 72 A 16 16 0 0 1 46 56 Z" fill="none" stroke="#CFF3E0" stroke-opacity="0.5" stroke-width="1.6"/>
        <g fill="#EAFFF4"><circle cx="72" cy="97" r="7"/><circle cx="100" cy="97" r="7"/><circle cx="128" cy="97" r="7"/></g>
        <path d="M50 74 L120 74" stroke="#fff" stroke-opacity="0.3" stroke-width="4" stroke-linecap="round"/>
      </g>
    </symbol>

    <symbol id="s-phone" viewBox="0 0 200 200">
      <ellipse cx="100" cy="166" rx="40" ry="8" fill="#0E3A28" opacity="0.22" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-6 100 100;6 100 100;-6 100 100" dur="2.6s" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite"/>
        <path d="M58 46 L84 42 L98 76 L84 90 A 60 60 0 0 0 110 116 L124 102 L158 116 L154 142 A 14 14 0 0 1 138 154 A 108 108 0 0 1 46 62 A 14 14 0 0 1 58 46 Z" fill="url(#lsPhone)"/>
        <path d="M58 46 L84 42 L98 76 L84 90 A 60 60 0 0 0 110 116 L124 102 L158 116 L154 142 A 14 14 0 0 1 138 154 A 108 108 0 0 1 46 62 A 14 14 0 0 1 58 46 Z" fill="none" stroke="#CFF3E0" stroke-opacity="0.55" stroke-width="1.8"/>
        <path d="M70 54 L86 52 L94 74" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
      </g>
    </symbol>

    <symbol id="s-video" viewBox="0 0 200 200">
      <ellipse cx="100" cy="164" rx="44" ry="8" fill="#1A1F2A" opacity="0.24" filter="url(#lsSoft2)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 3;0 -4;0 3" keyTimes="0;0.5;1" dur="4.2s" repeatCount="indefinite" additive="sum"/>
        <rect x="38" y="66" width="94" height="70" rx="16" fill="url(#lsVid)"/>
        <path d="M132 90 L166 70 L166 132 L132 112 Z" fill="#5B6580"/>
        <path d="M132 90 L166 70 L166 100 L132 100 Z" fill="#7C8698" opacity="0.7"/>
        <rect x="38" y="66" width="94" height="70" rx="16" fill="none" stroke="#9FB0D0" stroke-opacity="0.5" stroke-width="1.6"/>
        <circle cx="66" cy="90" r="9" fill="#9FD0FF" opacity="0.9"/>
        <rect x="50" y="76" width="24" height="6" rx="3" fill="#fff" opacity="0.2"/>
        <circle cx="118" cy="122" r="4" fill="#FF6B6B"><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/></circle>
      </g>
    </symbol>

  </defs></svg>`;

  function injectDefs(doc) {
    doc = doc || document;
    if (doc.getElementById('loom-symbols-defs')) return;
    var host = doc.createElement('div');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = DEFS;
    (doc.body || doc.documentElement).insertBefore(host, (doc.body || doc.documentElement).firstChild);
  }
  function svgHTML(sym, size) {
    size = size || 120;
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 200 200" style="display:block"><use href="#'+sym+'"/></svg>';
  }
  function freezeIfReduced(doc) {
    doc = doc || document;
    try {
      if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(function () {
          doc.querySelectorAll('#loom-symbols-defs ~ * svg, svg').forEach(function (s) {
            if (s.setCurrentTime) s.setCurrentTime(1.4);
            if (s.pauseAnimations) s.pauseAnimations();
          });
        });
      }
    } catch (e) {}
  }
  var API = { injectDefs: injectDefs, svgHTML: svgHTML, freezeIfReduced: freezeIfReduced,
              SYMS: ['s-coin','s-gem','s-gift','s-rocket','s-paint','s-spectrum','s-person','s-bookmark','s-gear'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.LoomSym = API;
})(typeof window !== 'undefined' ? window : this);

