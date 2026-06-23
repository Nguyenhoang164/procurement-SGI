# Fix WaybillNew.js
$filePath = 'C:\Users\kamit\Desktop\procurement-SGI\frontend\src\pages\WaybillNew.js'
$content = Get-Content $filePath -Raw

# 1. Add manualTotalCny to fromPOItems mapping
$content = $content -replace 'purchaseOrderItemId: item.purchaseOrderItemId \|\| item.id \|\| null,`r`n      \});', 'purchaseOrderItemId: item.purchaseOrderItemId || item.id || null,`r`n        manualTotalCny: undefined,`r`n      });'
Write-Host "✓ Added manualTotalCny to fromPOItems"

# 2. Add to addSelectedItems
$content = $content -replace "shippingMethod: item.shippingMethod \|\| '',`r`n        \}\);", "shippingMethod: item.shippingMethod || '',`r`n          manualTotalCny: undefined,`r`n        \}\);"
Write-Host "✓ Added manualTotalCny to addSelectedItems"

# 3. Add to productsPayload
$content = $content -replace "unitPriceVC: p.unitPriceVC \|\| '',`r`n      packageCount: p.packageCount", "unitPriceVC: p.unitPriceVC || '',`r`n      manualTotalCny: p.manualTotalCny,`r`n      packageCount: p.packageCount"
Write-Host "✓ Added manualTotalCny to productsPayload"

# 4. Update computedFreightVnd
$oldComputed = 'return sum + Math.round(\(Number\(p.volume\) \|\| 0\) \* \(Number\(p.unitPriceVC\) \|\| 0\) \* rate\);'
$newComputed = 'const cny = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));`r`n      return sum + Math.round(cny * rate);'
$content = $content -replace [regex]::Escape($oldComputed), $newComputed
Write-Host "✓ Updated computedFreightVnd"

# 5. Update summary calculation
$oldSummary = 'return s \+ Math.round(\(Number\(p.volume\) \|\| 0\) \* \(Number\(p.unitPriceVC\) \|\| 0\) \* rate\);'
$newSummary = 'const cny2 = p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0));`r`n                        return s + Math.round(cny2 * rate);'
$content = $content -replace [regex]::Escape($oldSummary), $newSummary
Write-Host "✓ Updated summary calculation"

# 6. Update per-currency calculation
$oldCurrency = 'const totalForeign = items.reduce\(\(s, p\) => s \+ \(Number\(p.volume\) \|\| 0\) \* \(Number\(p.unitPriceVC\) \|\| 0\), 0\);'
$newCurrency = 'const totalForeign = items.reduce((s, p) => s + (p.manualTotalCny !== undefined ? Number(p.manualTotalCny || 0) : (Number(p.volume || 0) * Number(p.unitPriceVC || 0))), 0);'
$content = $content -replace [regex]::Escape($oldCurrency), $newCurrency
Write-Host "✓ Updated per-currency calculation"

# 7. Change header order
$oldHeader = '<th style={{ width: 70 }}>KL/T.tích</th>`r`n                      <th style={{ width: 85 }}>Đơn giá VC</th>`r`n                      <th style={{ width: 80 }}>Tỷ giá</th>`r`n                      <th style={{ width: 90 }}>Tổng cước</th>`r`n                      <th style={{ width: 100 }}>Cước VC \(VNĐ\)</th>'
$newHeader = '<th style={{ width: 80 }}>Tỷ giá</th>`r`n                      <th style={{ width: 85 }}>Đơn giá VC</th>`r`n                      <th style={{ width: 90 }}>Tổng cước</th>`r`n                      <th style={{ width: 70 }}>KL/T.tích</th>`r`n                      <th style={{ width: 100 }}>Cước VC \(VNĐ\)</th>'
$content = $content -replace $oldHeader, $newHeader
Write-Host "✓ Header reordered"

# 8. Replace Tổng cước display with input
$oldDisplay = '<td style={{ fontWeight: 600 }}>{totalCny.toLocaleString(\x27vi-VN\x27)} {p.currency || \x27CNY\x27}</td>'
$newInput = '<td>\r\n                              <input type="number" step="0.01" value={(p.manualTotalCny !== undefined ? p.manualTotalCny : totalCny) || \x27\x27} onChange={e => updateProductField(idx, \x27manualTotalCny\x27, e.target.value)} style={{ width: \x27100\x27, padding: \x273px 4px\x27, border: \x271px solid #e2e8f0\x27, borderRadius: 4, fontSize: 12 }} />\r\n                            </td>'
$content = $content -replace $oldDisplay, $newInput
Write-Host "✓ Replaced Tổng cước with editable input"

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "`n✅ WaybillNew.js updated successfully!"
