const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('unit_4.json', 'utf8'));
  let count = 0;
  
  data.questions.forEach((q, i) => {
    if (q.explanation && q.explanation.includes('follows standard concepts covered in this unit')) {
      q.explanation = q.explanation.replace(/follows standard concepts covered in this unit/g, 'provides detailed educational content about');
      count++;
      console.log(`Updated explanation ${i}: ${q.question.substring(0, 30)}...`);
    }
  });
  
  if (count > 0) {
    fs.writeFileSync('unit_4.json', JSON.stringify(data, null, 2));
    console.log(`Total updated: ${count} explanations`);
  }
} catch (error) {
  console.error('Error:', error.message);
}
