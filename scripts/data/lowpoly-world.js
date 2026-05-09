/**
 * Pixel-grid world map — 72×36 cells (5° per cell)
 * col = floor((lon + 180) / 5)   [0–71]
 * row = floor((90  - lat) / 5)   [0–35]
 */
window.E64 = window.E64 || {};
window.E64.WORLD_GRID = (function () {
  var ROWS = 36, COLS = 72;
  var grid = new Uint8Array(ROWS * COLS);

  function fill(r0, r1, c0, c1) {
    for (var r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++)
      for (var c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++)
        grid[r * COLS + c] = 1;
  }
  function clear(r0, r1, c0, c1) {
    for (var r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++)
      for (var c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++)
        grid[r * COLS + c] = 0;
  }

  /* ─── NORTH AMERICA ─── */
  fill(4, 6,  0,  4);   // Alaska W (Seward/Chukchi)
  fill(3, 7,  4, 10);   // Alaska main body
  fill(4, 8,  9, 16);   // NW Canada / Yukon
  fill(4, 8, 16, 26);   // N Canada (NWT / Nunavut)
  fill(8, 9,  9, 26);   // S Canada band
  fill(9,13, 11, 23);   // USA lower 48
  fill(9,11, 22, 26);   // E Canada (Maritime + Newfoundland)
  fill(12,15,13, 20);   // Mexico
  fill(15,17,17, 21);   // Central America
  /* Hudson Bay (ocean) */
  clear(6, 10, 18, 22);
  /* Caribbean island chain */
  fill(13,16, 20, 26);

  /* ─── GREENLAND ─── */
  fill(2, 7, 26, 31);

  /* ─── ICELAND ─── */
  fill(5, 6, 32, 35);

  /* ─── SOUTH AMERICA ─── */
  fill(16,19, 22, 28);  // N S America (Venezuela / Guyana / Colombia)
  fill(16,20, 21, 22);  // Pacific coast (Colombia / Ecuador)
  fill(19,25, 22, 29);  // Brazil (main)
  fill(22,23, 28, 30);  // E Brazil bulge
  fill(22,29, 21, 26);  // Argentina / Chile
  fill(19,23, 23, 26);  // Bolivia / Paraguay

  /* ─── EUROPE ─── */
  fill(6, 8, 34, 37);   // UK + Ireland
  fill(9,11, 34, 37);   // Iberian Peninsula
  fill(8,10, 37, 41);   // France / Benelux / W Germany
  fill(7, 9, 38, 43);   // C Europe (Germany / Poland / Baltics)
  fill(4, 7, 38, 47);   // Scandinavia
  fill(9,12, 40, 44);   // Balkans + SE Europe
  fill(9,11, 38, 40);   // Italy
  fill(5, 9, 43, 48);   // E Europe / W Russia

  /* ─── AFRICA ─── */
  fill(10,15, 34, 50);  // N Africa (Sahara + Mediterranean coast)
  fill(15,22, 34, 50);  // W + C Africa
  fill(22,29, 38, 50);  // S Africa
  fill(14,20, 46, 54);  // E Africa + Horn of Somalia
  fill(20,26, 46, 50);  // Madagascar (merged with mainland at this res)

  /* ─── MIDDLE EAST / ARABIA ─── */
  fill(9, 12, 44, 50);  // Levant / Iraq / Syria
  fill(10,17, 46, 58);  // Arabia + Yemen + Oman + Iran
  fill(9, 12, 42, 45);  // Turkey (Anatolia)

  /* ─── RUSSIA ─── */
  fill(3,  6, 44, 71);  // N Siberia (full east)
  fill(6,  9, 44, 71);  // S Siberia + Russian Far East
  fill(9, 12, 46, 62);  // C Asia (Kazakhstan / Uzbekistan)

  /* ─── SOUTH ASIA ─── */
  fill(10,14, 56, 63);  // W China / Tibet / Xinjiang (link)
  fill(11,16, 50, 58);  // Pakistan + India N
  fill(14,19, 51, 59);  // India
  fill(17,18, 54, 55);  // Sri Lanka

  /* ─── EAST ASIA ─── */
  fill(7, 14, 58, 71);  // China + Manchuria + Korea
  fill(7, 12, 62, 66);  // Japan (Honshu + Hokkaido)
  fill(14,17, 62, 65);  // Philippines

  /* ─── SE ASIA ─── */
  fill(13,17, 56, 61);  // Indochina (Myanmar / Thailand / Vietnam)
  fill(15,19, 58, 62);  // Malay Peninsula + S Vietnam
  fill(17,21, 57, 62);  // Sumatra
  fill(16,22, 60, 65);  // Borneo
  fill(19,22, 62, 67);  // Java + Sulawesi
  fill(19,23, 65, 70);  // Papua New Guinea + Maluku

  /* ─── AUSTRALIA ─── */
  fill(20,28, 60, 68);  // Australia main body
  clear(21,24, 63, 67); // Gulf of Carpentaria (ocean)
  fill(20,22, 64, 67);  // Cape York Peninsula
  fill(27,29, 66, 68);  // Tasmania

  /* ─── NEW ZEALAND ─── */
  fill(25,30, 70, 71);

  /* ─── ANTARCTICA ─── */
  fill(30,30,  3, 67);  // N fringe
  fill(31,35,  0, 71);  // Full cap

  return { grid: grid, rows: ROWS, cols: COLS };
})();
