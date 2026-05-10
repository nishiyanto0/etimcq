const fs = require('fs');
const path = require('path');

const MAPPINGS = {
  'iot': 'internet of things',
  'ai': 'artificial intelligence',
  'ml': 'machine learning',
  'dl': 'deep learning',
  'vr': 'virtual reality',
  'ar': 'augmented reality',
  'mr': 'mixed reality',
  'xr': 'extended reality',
  'ngn': 'next generation network',
  'mfa': 'multi-factor authentication',
  'df': 'digital forensics',
  'eh': 'ethical hacking',
  'ncsp': 'national cyber security policy',
  'it act': 'information technology act',
  'ccpwc': 'cyber crime prevention against women and children',
  'dpdp': 'digital personal data protection',
  'cert-in': 'computer emergency response team india',
  '5g': '5g network',
  'blockchain': 'blockchain',
  'quantum': 'quantum computing',
  'green computing': 'green computing'
};

const files = [
  'e:/mcq web/data/unit_1.json',
  'e:/mcq web/data/unit_2.json',
  'e:/mcq web/data/unit_3.json',
  'e:/mcq web/data/unit_4.json',
  'e:/mcq web/data/unit_5.json',
  'e:/mcq web/data/college_mcq.json',
  'e:/mcq web/data/nirali_mcq.json'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  console.log(`Deep cleaning and re-tagging ${file}...`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.questions.forEach(q => {
    // 1. Clear existing tags to start fresh
    delete q.tags; 
    
    const tags = new Set();
    const content = `${q.question} ${q.options.join(' ')}`.toLowerCase();
    
    for (const [abbr, full] of Object.entries(MAPPINGS)) {
      // Use strict word boundaries \b to prevent matching inside words like "Artificial" or "Hardware"
      const abbrRegex = new RegExp(`\\b${abbr.replace('-', '\\-')}\\b`, 'i');
      const fullRegex = new RegExp(`\\b${full}\\b`, 'i');
      
      if (abbrRegex.test(content) || fullRegex.test(content)) {
        tags.add(abbr);
      }
    }
    
    // Only add tags if we found any
    if (tags.size > 0) {
      q.tags = Array.from(tags);
    }
  });
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
});

console.log('STRICT Auto-tagging complete! All "AR" matches are now confirmed standalone words.');
