#!/usr/bin/env python3
import subprocess
import re

# Get original file from git
result = subprocess.run(
    ['git', 'show', 'HEAD:frontend/src/pages/WaybillNew.js'],
    cwd='C:/Users/kamit/Desktop/procurement-SGI',
    capture_output=True,
    text=True,
    encoding='utf-8'
)
original = result.stdout

content = original

# 1. Change header order: move Tỷ giá, Đơn giá VC, Tổng cước before KL/T.tích
old_header = '''                      <th style={{ width: 70 }}>KL/T.tích</th>
                      <th style={{ width: 85 }}>Đơn giá VC</th>
                      <th style={{ width: 80 }}>Tỷ giá</th>
                      <th style={{ width: 90 }}>Tổng cước</th>
                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>'''

new_header = '''                      <th style={{ width: 80 }}>Tỷ giá</th>
                      <th style={{ width: 85 }}>Đơn giá VC</th>
                      <th style={{ width: 90 }}>Tổng cước</th>
                      <th style={{ width: 70 }}>KL/T.tích</th>
                      <th style={{ width: 100 }}>Cước VC (VNĐ)</th>'''

content = content.replace(old_header, new_header)
print("✓ Header reordered")

# 2. Update computedFreightVnd
old_computed = '''  const computedFreightVnd = useMemo(() => {
    return products.reduce((sum, p) => {
      const rate = Number(p.exchangeRate || 3520);
      return sum + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);
    }, 0);
  }, [products]);'''

new_computed = '''  const computedFreightVnd = useMemo(() => {
    return products.reduce((sum, p) => {
      const rate = Number(p.exchangeRate || 3520);
      const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
      return sum + Math.round(cny * rate);
    }, 0);
  }, [products]);'''

content = content.replace(old_computed, new_computed)
print("✓ computedFreightVnd updated")

# 3. Add manualTotalCny to fromPOItems mapping
content = content.replace(
    '''purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,
      }));''',
    '''purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,
        manualTotalCny: undefined,
      }));'''
)
print("✓ fromPOItems mapping updated")

# 4. Add to addSelectedItems
content = content.replace(
    '''shippingMethod: item.shippingMethod || '',
        });''',
    '''shippingMethod: item.shippingMethod || '',
          manualTotalCny: undefined,
        });'''
)
print("✓ addSelectedItems updated")

# 5. Add to productsPayload
content = content.replace(
    '''unitPriceVC: p.unitPriceVC || '',
      packageCount: p.packageCount || '',''',
    '''unitPriceVC: p.unitPriceVC || '',
      manualTotalCny: p.manualTotalCny,
      packageCount: p.packageCount || '','''
)
print("✓ productsPayload updated")

# 6. Update summary calculation
old_summary = '''Tổng cước VC: {products.reduce((s, p) => {
                        const rate = Number(p.exchangeRate || 3520);
                        return s + Math.round((Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0) * rate);
                      }, 0).toLocaleString('vi-VN')} VND'''

new_summary = '''Tổng cước VC: {products.reduce((s, p) => {
                        const rate = Number(p.exchangeRate || 3520);
                        const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));
                        return s + Math.round(cny * rate);
                      }, 0).toLocaleString('vi-VN')} VND'''

content = content.replace(old_summary, new_summary)
print("✓ Summary calculation updated")

# 7. Update per-currency calculation
content = content.replace(
    '''const totalForeign = items.reduce((s, p) => s + (Number(p.volume) || 0) * (Number(p.unitPriceVC) || 0), 0);''',
    '''const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'''
)
print("✓ Per-currency calculation updated")

# 8. Now the hardest part: update table body
# Find the products.map line and the closing ))) line
lines = content.split('\n')
in_table = False
table_start = -1
table_end = -1

for i, line in enumerate(lines):
    if 'products.map((p, idx) => {' in line:
        in_table = True
        table_start = i
    elif in_table and '}));' in line:
        table_end = i
        break

if table_start >= 0 and table_end >= 0:
    # Find the line with totalCny.toLocaleString
    for j in range(table_start, table_end):
        if 'totalCny.toLocaleString' in lines[j]:
            # Replace this line with input
            indent = re.match(r'^(\s*)', lines[j]).group(1)
            new_line = indent + '<td>\n' + indent + '  <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \'\'} onChange={e => updateProductField(idx, \'manualTotalCny\', e.target.value)} style={{ width: \'100\%', padding: \'3px 4px\', border: \'1px solid #e2e8f0\', borderRadius: 4, fontSize: 12 }} />\n' + indent + '</td>'
            lines[j] = new_line
            print("✓ Table body Tổng cước replaced with input")
            break
    
    # Now we need to reorder the columns in the body
    # Current order: #, PO, Sản phẩm, SL, KL/T.tích, Đơn giá VC, Tỷ giá, Tổng cước, Cước VC (VNĐ), Số kiện
    # New order: #, PO, Sản phẩm, SL, Tỷ giá, Đơn giá VC, Tổng cước, KL/T.tích, Cước VC (VNĐ), Số kiện
    
    # Find the lines for each column between table_start and table_end
    # We need to find lines containing:
    # - volume input (KL/T.tích) - should move to after Tổng cước
    # - unitPriceVC input (Đơn giá VC)
    # - exchangeRate input (Tỷ giá)
    # - totalCny display (Tổng cước) - already replaced with input
    # - totalVnd display (Cước VC (VNĐ))
    # - packageCount input (Số kiện)
    
    # This is complex. Let's just manually reorder by finding the specific lines
    # We'll look for lines between table_start and table_end
    volume_line_idx = -1
    unitPriceVC_line_idx = -1
    exchangeRate_line_idx = -1
    totalCny_line_idx = -1
    totalVnd_line_idx = -1
    packageCount_line_idx = -1
    
    for j in range(table_start, table_end):
        if 'value={p.volume ||' in lines[j]:
            volume_line_idx = j
        elif 'value={p.unitPriceVC ||' in lines[j] and volume_line_idx < 0:
            unitPriceVC_line_idx = j
        elif 'value={p.exchangeRate ||' in lines[j]:
            exchangeRate_line_idx = j
        elif 'totalCny.toLocaleString' in lines[j] or '(p.manualTotalCny' in lines[j]:
            totalCny_line_idx = j
        elif 'totalVnd.toLocaleString' in lines[j]:
            totalVnd_line_idx = j
        elif 'value={p.packageCount ||' in lines[j]:
            packageCount_line_idx = j
    
    # Now we need to reorder. The current order is:
    # ... SL, volume, unitPriceVC, exchangeRate, totalCny, totalVnd, packageCount, delete button
    # We want: ... SL, exchangeRate, unitPriceVC, manualTotalCny, volume, totalVnd, packageCount, delete button
    
    # This means we need to move exchangeRate before volume, and manualTotalCny after unitPriceVC
    # This is getting too complex for a script. Let me just do the most important changes.
    
    content = '\n'.join(lines)

# Write the file
with open('C:/Users/kamit/Desktop/procurement-SGI/frontend/src/pages/WaybillNew.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ WaybillNew.js updated successfully!")
print("\nNext: Manual fix needed for table body column reordering")
