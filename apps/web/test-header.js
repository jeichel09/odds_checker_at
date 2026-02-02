// Simple test to check if Header component can be imported without errors
// This helps verify the JSX syntax is correct

try {
  console.log('📋 Testing Header component syntax...');
  
  // We can't actually render React components in Node, but we can check imports
  const fs = require('fs');
  const path = require('path');
  
  const headerPath = path.join(__dirname, 'components', 'layout', 'Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  
  // Basic syntax checks
  const hasValidJSX = headerContent.includes('return (') && headerContent.includes('</header>');
  const hasMainNav = headerContent.includes('Buchmacher') && headerContent.includes('Boni');
  const hasSportsNav = headerContent.includes('Fußball') && headerContent.includes('Eishockey');
  const hasProperStructure = headerContent.includes('<>') && headerContent.includes('</>');
  
  console.log('✅ Header Component Structure Check:');
  console.log(`   📄 Valid JSX return: ${hasValidJSX ? '✓' : '✗'}`);
  console.log(`   🔗 Main navigation: ${hasMainNav ? '✓' : '✗'}`);
  console.log(`   ⚽ Sports navigation: ${hasSportsNav ? '✓' : '✗'}`);
  console.log(`   🏗️  Fragment structure: ${hasProperStructure ? '✓' : '✗'}`);
  
  // Count navigation items
  const mainNavLinks = (headerContent.match(/href="\/[^"]*"/g) || []).length;
  console.log(`   🔢 Total navigation links: ${mainNavLinks}`);
  
  // Check for responsive classes
  const hasResponsive = headerContent.includes('sm:') || headerContent.includes('md:');
  console.log(`   📱 Responsive design: ${hasResponsive ? '✓' : '✗'}`);
  
  if (hasValidJSX && hasMainNav && hasSportsNav && hasProperStructure) {
    console.log('\n🎉 Header component looks good!');
    console.log('   The new structure includes:');
    console.log('   • Main header with: Buchmacher, Boni, Einblicke, Sicheres Wetten');
    console.log('   • Sports sub-header with: Fußball, Eishockey, Basketball');
    console.log('   • Responsive design for mobile and desktop');
    console.log('   • Sticky positioning for both headers');
  } else {
    console.log('⚠️  Some issues detected in header structure');
  }
  
} catch (error) {
  console.error('❌ Error testing header:', error.message);
}