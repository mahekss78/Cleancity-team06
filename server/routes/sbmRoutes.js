const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ====================================================================
// SBM ANALYTICS SUITE 
// Dynamically powered by Indian Cities Database (Kaggle)
// ====================================================================

// Base seed data for top performers (to maintain "Awards" integrity)
const TOP_PERFORMERS = {
  "Indore": { d2d: 100, segregation: 100, processing: 100, publicToilet: 99, gfcStatus: "5-Star", nationalRank: 1 },
  "Surat": { d2d: 99, segregation: 98, processing: 97, publicToilet: 96, gfcStatus: "5-Star", nationalRank: 2 },
  "Navi Mumbai": { d2d: 97, segregation: 95, processing: 94, publicToilet: 95, gfcStatus: "5-Star", nationalRank: 3 },
  "Mysuru": { d2d: 96, segregation: 94, processing: 92, publicToilet: 94, gfcStatus: "5-Star", nationalRank: 5 },
  "Ambikapur": { d2d: 95, segregation: 93, processing: 90, publicToilet: 92, gfcStatus: "5-Star", nationalRank: 6 },
  "Vadodara": { d2d: 92, segregation: 87, processing: 85, publicToilet: 88, gfcStatus: "3-Star", nationalRank: 22 },
  "Bhopal": { d2d: 95, segregation: 92, processing: 91, publicToilet: 94, gfcStatus: "3-Star", nationalRank: 18 }
};

let SBM_GEOGRAPHY = {}; 
let ALL_ULBS = [];

const bootstrapSBMData = () => {
  const csvPath = path.join(__dirname, '..', 'data', 'indian_cities.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('SBM DATA ERROR: indian_cities.csv NOT FOUND');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  const tempAll = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;

    const city = cols[0].trim();
    const latStr = cols[1].trim();
    const lngStr = cols[2].trim();
    const state = cols[5].trim().replace(/\r/g, '');

    const latVal = parseFloat(latStr) || 0;
    const lngVal = parseFloat(lngStr) || 0;
    const seed = Math.abs(Math.floor(latVal * 1000) + Math.floor(lngVal * 1000) + (city.length * 13));
    
    // Seeded Metrics
    const perf = TOP_PERFORMERS[city] || {};
    
    const ulb = {
      name: city,
      state: state,
      lat: latVal,
      lng: lngVal,
      population: 150000 + (seed * 150),
      d2d: perf.d2d || (70 + (seed % 31)),
      segregation: perf.segregation || (65 + (seed % 35)),
      processing: perf.processing || (60 + (seed % 38)),
      publicToilet: perf.publicToilet || (70 + (seed % 28)),
      ctCapacity: 70 + (seed % 28),
      wasteReduction: 60 + (seed % 35)
    };

    // Calculate Composite Score for Ranking/Certification
    // Max Possible: 600
    ulb.compositeScore = ulb.d2d + ulb.segregation + ulb.processing + ulb.publicToilet + ulb.ctCapacity + ulb.wasteReduction;
    
    // Logic-based GFC Certification
    if (perf.gfcStatus) {
      ulb.gfcStatus = perf.gfcStatus;
    } else {
      if (ulb.compositeScore > 540) ulb.gfcStatus = "5-Star";
      else if (ulb.compositeScore > 480) ulb.gfcStatus = "3-Star";
      else if (ulb.compositeScore > 400) ulb.gfcStatus = "1-Star";
      else ulb.gfcStatus = "Non-rated";
    }

    tempAll.push(ulb);
  }

  // GLOBAL RANKING (National)
  tempAll.sort((a, b) => b.compositeScore - a.compositeScore);
  tempAll.forEach((u, idx) => {
    const perf = TOP_PERFORMERS[u.name];
    u.nationalRank = perf ? perf.nationalRank : (idx + 1);
  });

  // Re-sort National Rank to fix the gaps left by TOP_PERFORMERS manual ranks
  tempAll.sort((a, b) => a.nationalRank - b.nationalRank);
  tempAll.forEach((u, idx) => u.nationalRank = idx + 1);

  // STATE-WISE GROUPING & RANKING
  const tempGeo = {};
  tempAll.forEach(u => {
    if (!tempGeo[u.state]) tempGeo[u.state] = [];
    tempGeo[u.state].push(u);
  });

  Object.keys(tempGeo).forEach(state => {
    tempGeo[state].sort((a, b) => b.compositeScore - a.compositeScore);
    tempGeo[state].forEach((u, idx) => u.stateRank = idx + 1);
  });

  SBM_GEOGRAPHY = tempGeo;
  ALL_ULBS = tempAll;
  console.log(`✅ SBM Unified Analytics: Ready with ${ALL_ULBS.length} cities.`);
};

bootstrapSBMData();

// API Endpoints
router.get('/states', (req, res) => res.json(Object.keys(SBM_GEOGRAPHY).sort()));

router.get('/state/:stateName', (req, res) => {
  const state = req.params.stateName;
  const ulbs = SBM_GEOGRAPHY[state];
  if (!ulbs) return res.status(404).json({ message: 'State not found' });
  const avgD2D = Math.round(ulbs.reduce((acc, u) => acc + u.d2d, 0) / ulbs.length * 10) / 10;
  res.json({ name: state, totalULBs: ulbs.length, avgD2D, odfPlusCities: ulbs.filter(u => u.gfcStatus !== "Non-rated").length, ulbs });
});

router.get('/city-report', (req, res) => {
  const { state, city } = req.query;
  const stateUlbs = SBM_GEOGRAPHY[state];
  if (!stateUlbs) return res.status(404).json({ message: 'State not found' });
  const cityData = stateUlbs.find(u => u.name.toLowerCase() === city.toLowerCase());
  if (!cityData) return res.status(404).json({ message: 'City not found' });
  res.json({ ...cityData, totalULBsInState: stateUlbs.length });
});

router.get('/awards', (req, res) => {
  const awards = [...ALL_ULBS].sort((a, b) => a.nationalRank - b.nationalRank).slice(0, 10).map((u, i) => ({
    ...u, rank: i + 1, city: u.name, highlight: i === 0 ? "National Champion. Zero-landfill city model." : "Outstanding urban sanitation performance."
  }));
  res.json(awards);
});

router.get('/geography', (req, res) => {
  const geo = {};
  Object.entries(SBM_GEOGRAPHY).forEach(([stateName, ulbs]) => { geo[stateName] = ulbs.map(u => u.name).sort(); });
  res.json(geo);
});

module.exports = router;
