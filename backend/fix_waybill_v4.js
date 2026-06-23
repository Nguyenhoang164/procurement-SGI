const fs = require('fs');
const { execSync } = require('child_process');

// Fix WaybillNew.js
const waybillPath = 'C:\\Users\\kamit\\Desktop\\procurement-SGI\\frontend\\src\\pages\\WaybillNew.js';

const originalWaybill = execSync('git show HEAD:frontend/src/pages/WaybillNew.js', {
  cwd: 'C:\\Users\\kamit\\Desktop\\procurement-SGI',
  encoding: 'utf8'
});

let content = originalWaybill;

// 1. Change header
content = content.replace(
  '<th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>',
  '<th style={{ width: 80 }}>Tỷ giá</th>\n                      <th style={{ width: 85 }}>Đơn giá VC</th>\n                      <th style={{ width: 90 }}>Tổng cước</th>\n                      <th style={{ width: 70 }}>KL/T.tích</th>\n                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>'
);
console.log('✓ Header reordered');

// 2. Update computedFreightVnd
content = content.replace(
  'return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);',
  'const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n      return sum + Math.round(cny * rate);'
);
console.log('✓ computedFreightVnd updated');

// 3. Add manualTotalCny field
content = content.replace(
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
);
console.log('✓ fromPOItems updated');

content = content.replace(
  "shippingMethod: item.shippingMethod || '',\n        });",
  "shippingMethod: item.shippingMethod || '',\n          manualTotalCny: undefined,\n        });"
);
console.log('✓ addSelectedItems updated');

content = content.replace(
  "unitPriceVC: p.unitPriceVC || '',\n      packageCount: p.packageCount || '',",
  "unitPriceVC: p.unitPriceVC || '',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount || '',"
);
console.log('✓ productsPayload updated');

// 4. Update summary
content = content.replace(
  'return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);',
  'const cny2 = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n                        return s + Math.round(cny2 * rate);'
);
console.log('✓ Summary calculation updated');

// 5. Update per-currency
content = content.replace(
  'const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);',
  'const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'
);
console.log('✓ Per-currency calculation updated');

// 6. Replace display with input
// Use a function to avoid template string issues
function getReplacement() {
  return '<td>\n' +
    '                              <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \'\'} onChange={e => updateProductField(idx, \'manualTotalCny\', e.target.value)} style={{ width: \'100\%', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n' +
    '                            </td>';
}

const replacement = getReplacement();
content = content.replace(
  /<td style=\{\{ fontWeight: 600 \}\}>\{totalCny\.toLocaleString\(\'vi-VN\'\)\} \{p\.currency \|\| \'CNY\'\}<\/td>/,
  replacement
);
console.log('✓ Table body replaced with input');

fs.writeFileSync(waybillPath, content, 'utf8');
console.log('\n✅ WaybillNew.js updated successfully!');
