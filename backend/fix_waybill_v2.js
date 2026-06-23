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

console.log('Step 1: Header reordered');

// 2. Update computedFreightVnd
const oldComputed = 'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);\n    }, 0);\n  }, [products]);';

const newComputed = 'const computedFreightVnd = useMemo(() => {\n    return products.reduce((sum, p) => {\n      const rate = Number(p.exchangeRate || 3520);\n      const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n      return sum + Math.round(cny * rate);\n    }, 0);\n  }, [products]);';

content = content.replace(oldComputed, newComputed);
console.log('Step 2: computedFreightVnd updated');

// 3. Add manualTotalCny to fromPOItems
content = content.replace(
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n      }));',
  'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,\n        manualTotalCny: undefined,\n      }));'
);
console.log('Step 3: fromPOItems updated');

// 4. Add to addSelectedItems
content = content.replace(
  'shippingMethod: item.shippingMethod || \'\',\n        });',
  'shippingMethod: item.shippingMethod || \'\',\n          manualTotalCny: undefined,\n        });'
);
console.log('Step 4: addSelectedItems updated');

// 5. Add to productsPayload
content = content.replace(
  'unitPriceVC: p.unitPriceVC || \'\',\n      packageCount: p.packageCount || \'\',',
  'unitPriceVC: p.unitPriceVC || \'\',\n      manualTotalCny: p.manualTotalCny,\n      packageCount: p.packageCount || \'\''
);
console.log('Step 5: productsPayload updated');

// 6. Update summary calculation
const oldSummary = 'Tổng cước VC: {products.reduce((s, p) => {\n                        const rate = Number(p.exchangeRate || 3520);\n                        return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);\n                      }, 0).toLocaleString(\'vi-VN\')} VND';

const newSummary = 'Tổng cước VC: {products.reduce((s, p) => {\n                        const rate = Number(p.exchangeRate || 3520);\n                        const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));\n                        return s + Math.round(cny * rate);\n                      }, 0).toLocaleString(\'vi-VN\')} VND';

content = content.replace(oldSummary, newSummary);
console.log('Step 6: Summary updated');

// 7. Update per-currency calculation
content = content.replace(
  'const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);',
  'const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'
);
console.log('Step 7: Per-currency calculation updated');

// 8. Change table body - this is the hardest part
// We need to find the exact body and replace it
// Let's use a regex to find and replace

const oldBodyRegex = /<td>\{idx \+ 1\}<\/td>\s+<td style=\{\{ fontSize: 11 \}\}>\{p\.poCode\}<\/td>\s+<td>\{p\.productName\}\{p\.posCode \? ` \(\${p\.posCode}\)` : ''\}<\/td>\s+<td>\{p\.orderedQty\}<\/td>\s+<td>\s+<input type="number" step="0\.01" value=\{p\.volume \|\| ''\} onChange=\{e => updateProductField\(idx, 'volume', e\.target\.value\)\} style=\{\{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 \}\} \/>\s+<\/td>\s+<td>\s+<input type="number" step="0\.01" value=\{p\.unitPriceVC \|\| ''\} onChange=\{e => updateProductField\(idx, 'unitPriceVC', e\.target\.value\)\} style=\{\{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 \}\} \/>\s+<\/td>\s+<td>\s+<input type="number" step="1" value=\{p\.exchangeRate \|\| ''\} onChange=\{e => updateProductField\(idx, 'exchangeRate', e\.target\.value\)\} style=\{\{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 \}\} \/>\s+<\/td>\s+<td style=\{\{ fontWeight: 600 \}\}>\{totalCny\.toLocaleString\(\'vi-VN\'\)\} \{p\.currency \|\| 'CNY'\}<\/td>\s+<td style=\{\{ fontWeight: 600 \}\}>\{totalVnd\.toLocaleString\(\'vi-VN\'\)\} \u20AC\u01A3<\/td>\s+<td>\s+<input type="number" value=\{p\.packageCount \|\| ''\} onChange=\{e => updateProductField\(idx, 'packageCount', e\.target\.value\)\} style=\{\{ width: '100%', padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 \}\} \/>\s+<\/td>/g;

// This regex is too complex. Let's try a simpler approach
// We'll split by lines and replace the specific lines

let lines = content.split('\n');
let inTableBody = false;
let tableStartIdx = -1;

// Find the table body
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('products.map((p, idx) => {')) {
    inTableBody = true;
    tableStartIdx = i;
  } else if (inTableBody && lines[i].includes('}));')) {
    inTableBody = false;
    // Found the table body, now replace the relevant lines
    // We need to find lines between tableStartIdx and i
    for (let j = tableStartIdx; j < i && j < lines.length; j++) {
      // Replace the Tổng cước display line (line with totalCny.toLocaleString)
      if (lines[j].includes('totalCny.toLocaleString')) {
        // This is the line: <td style={{ fontWeight: 600 }}>{totalCny.toLocaleString('vi-VN')} {p.currency || 'CNY'}</td>
        // Replace with input
        const indent = lines[j].match(/^\s*/)[0];
        lines[j] = indent + '<td>\n' + indent + '  <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \'\'}\n' + indent + '    onChange={e => updateProductField(idx, \'manualTotalCny\', e.target.value)}\n' + indent + '    style={{ width: \'100\%', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n' + indent + '</td>';
      }
    }
    break;
  }
}

content = lines.join('\n');
console.log('Step 8: Table body updated');

fs.writeFileSync(waybillPath, content, 'utf8');
console.log('WaybillNew.js updated successfully!');
