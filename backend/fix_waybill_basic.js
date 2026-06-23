const fs = require('fs');
const { execSync } = require('child_process');

// Fix WaybillNew.js
const waybillPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';

const originalWaybill = execSync('git show HEAD:frontend/src/pages/WaybillNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let content = originalWaybill;

// 1. Change header - move Tỷ giá, Đơn giá VC, Tổng cước before KL/T.tích
content = content.replace(
  '<th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>',
  '<th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>'
);
console.log('✓ Header reordered');

// 2. Update computedFreightVnd to support manualTotalCny
content = content.replace(
  'return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);',
  'const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n      return sum + Math.round(cny * rate);'
);
console.log('✓ computedFreightVnd updated');

// 3. Add manualTotalCny to product objects in fromPOItems
content = content.replace(
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
);
console.log('✓ fromPOItems updated');

// 4. Add to addSelectedItems
content = content.replace(
  "shippingMethod: item.shippingMethod || '',\n        });",
  "shippingMethod: item.shippingMethod || '',\n          manualTotalCny: undefined,\n        });"
);
console.log('✓ addSelectedItems updated');

// 5. Add to productsPayload for API submit
content = content.replace(
  "unitPriceVC: p.unitPriceVC || '',\n      packageCount: p.packageCount || '',",
  "unitPriceVC: p.unitPriceVC || '',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount || '',"
);
console.log('✓ productsPayload updated');

// 6. Update summary calculation
content = content.replace(
  'return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);',
  'const cny2 = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n                        return s + Math.round(cny2 * rate);'
);
console.log('✓ Summary calculation updated');

// 7. Update per-currency calculation
content = content.replace(
  'const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);',
  'const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'
);
console.log('✓ Per-currency calculation updated');

// 8. Update table body - reorder columns
// Current: ... SL, volume input, unitPriceVC input, exchangeRate input, totalCny display, totalVnd display, packageCount input...
// New: ... SL, exchangeRate input, unitPriceVC input, manualTotalCny input, volume input, totalVnd display, packageCount input...
// We'll use a multi-step replacement

// First, let's find and reorder the lines
let lines = content.split('\n');
let modified = false;

for (let i = 0; i < lines.length - 5; i++) {
  // Find the pattern where we have volume, unitPriceVC, exchangeRate inputs in sequence
  if (lines[i].includes('value={p.volume ||') &&
      lines[i+3].includes('value={p.unitPriceVC ||') &&
      lines[i+6].includes('value={p.exchangeRate ||')) {
    
    // Found the volume input block (3 lines: opening td, input, closing td)
    // We need to extract and reorder
    const volumeBlock = lines.slice(i, i+3).join('\n');
    const unitPriceVCBlock = lines.slice(i+3, i+6).join('\n');
    const exchangeRateBlock = lines.slice(i+6, i+9).join('\n');
    const totalCnyBlock = lines.slice(i+9, i+11).join('\n'); // 2 lines
    
    // New order: exchangeRate, unitPriceVC, manualTotalCny (we'll add this), volume, totalVnd
    const newOrder = exchangeRateBlock + '\n' + unitPriceVCBlock + '\n' + 
      '<td>\n' +
      '                              <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \'\'} onChange={e => updateProductField(idx, \'manualTotalCny\', e.target.value)} style={{ width: \'100\%', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n' +
      '                            </td>' + '\n' +
      volumeBlock;
    
    // Replace the old blocks with new order
    lines.splice(i, 11, newOrder);
    modified = true;
    break;
  }
}

if (modified) {
  content = lines.join('\n');
  console.log('✓ Table body reordered and manualTotalCny input added');
} else {
  console.log('⚠ Table body reordering not applied (pattern not found)');
  console.log('  Manual fix needed for table body column order');
}

fs.writeFileSync(waybillPath, content, 'utf8');
console.log('\n✅ WaybillNew.js updated!');
